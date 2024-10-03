import { useState, useEffect } from "react";
import "./playground.css";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";
import { useChatInteract, useChatMessages } from "@chainlit/react-client";
import { Cards } from "./card";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import StopCircleRoundedIcon from "@mui/icons-material/StopCircleRounded";
import { firestore, auth } from "./firebase";
import { useTheme } from "./theme"; // Import useTheme

import {
  collection,
  addDoc,
  doc,
  getDoc,
  deleteDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";

let val = 0;
let chaid;
let cal1 = 0;

export function Playground() {
  const [inputValue, setInputValue] = useState("");
  const { theme } = useTheme(); // Access theme
  const [isSending, setIsSending] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [localMessages, setLocalMessages] = useState([]); // Current chat messages
  const [historia, setHistoria] = useState([]); // Messages loaded from Firebase
  const [chatHistories, setChatHistories] = useState([]);
  const [userId, setUserId] = useState(null);
  const [currentChatId, setCurrentChatId] = useState(null);

  const { sendMessage, stopTask, clear } = useChatInteract();
  const { messages } = useChatMessages();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserId(user.uid);
        await loadChatHistories(user.uid);
      } else {
        setUserId(null);
        setChatHistories([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadChatHistories = async (userId) => {
    try {
      const chatHistoriesQuery = query(
        collection(firestore, "chatHistories"),
        where("userId", "==", userId)
      );
      const chatHistoriesSnapshot = await getDocs(chatHistoriesQuery);
      const histories = chatHistoriesSnapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title,
      }));
      setChatHistories(histories);
    } catch (error) {
      console.error("Error loading chat histories:", error);
    }
  };

  const saveChatToFirebase = async () => {
    if (localMessages.length > 0 && userId) {
      try {
        const newChat = {
          userId,
          messages: localMessages,
          title:
            localMessages[0].output ||
            `Chat Session ${chatHistories.length + 1}`,
          createdAt: new Date(),
        };
        const chatRef = await addDoc(
          collection(firestore, "chatHistories"),
          newChat
        );
        const newChatId = chatRef.id;

        setChatHistories((prevHistories) => [
          ...prevHistories,
          { id: newChatId, title: newChat.title },
        ]);
        setCurrentChatId(newChatId);
        return true;
      } catch (error) {
        console.error("Error saving chat to Firebase:", error);
        return false;
      }
    }
    return true; // Proceed if no messages to save
  };

  const handleSendMessage = async (content) => {
    if (isSending) {
      await handleStopTask();
    }

    if (content) {
      cal1 = 1;
      setIsSending(true);
      const message = {
        name: "user",
        type: "user_message",
        output: content,
      };
      try {
        await sendMessage(message, []);
        setLocalMessages((prevMessages) => [...prevMessages, message]);
      } catch (error) {
        console.error("Error sending message:", error);
      }
      setInputValue("");
    }
  };

  const handleStopTask = async () => {
    try {
      await stopTask();
      setIsSending(false);
    } catch (error) {
      console.error("Error stopping task:", error);
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.output.includes("&*&8")) {
        setIsSending(false);
      }
      setLocalMessages([...messages]);
    }
  }, [messages]);

  const cleanMessageOutput = (output) => {
    return output.replace("&*&8", "");
  };

  const shouldSkipMessage = (message) => {
    return message.output.includes("Task manually stopped");
  };

  const startChat = (message) => {
    setChatStarted(true);
    handleSendMessage(message);
  };

  const resetChat = async () => {
    // if (isProcessing) return;
    //setIsProcessing(true);

    try {
      val = 0;
      if (cal1 == 1) {
        const savedSuccessfully = await saveChatToFirebase();
        cal1 = 0;
      }
      //  if (savedSuccessfully) {
      await handleStopTask();
      setChatStarted(false);
      setLocalMessages([]);
      setHistoria([]); // Clear historia when resetting chat
      setInputValue("");
      await clear();
      //}
    } finally {
      // setIsProcessing(false);
      console.log("hi");
    }
  };
  // Function to handle chat deletion
  const handleDeleteChat = async (chatId) => {
    try {
      // Delete the chat document from Firebase
      await deleteDoc(doc(firestore, "chatHistories", chatId));

      // Update local chat histories after deletion
      setChatHistories((prevHistories) =>
        prevHistories.filter((history) => history.id !== chatId)
      );
      cal1 = 0;
      resetChat();
    } catch (error) {
      console.error("Error deleting chat history:", error);
    }
  };
  const loadChatFromFirebase = async (chatId) => {
    try {
      await setLocalMessages([]);
      await handleStopTask();
      await setHistoria([]);
      await clear();
      val = 1;
      chaid = chatId;
      const chatRef = doc(firestore, "chatHistories", chatId);
      const chatDoc = await getDoc(chatRef);

      if (chatDoc.exists()) {
        const chatData = chatDoc.data();
        setHistoria(chatData.messages || []); // Load messages from Firebase into 'historia'
        setLocalMessages([]); // Clear local messages for the new session
        setChatStarted(true);
        setCurrentChatId(chatId);
      } else {
        console.error("No such chat history found!");
      }
    } catch (error) {
      console.error("Error loading chat from Firebase:", error);
    }
  };
  const handlechats = async (chatId) => {
    if (cal1 == 1) {
      await saveChatToFirebase();
    }
    loadChatFromFirebase(chatId);
  };
  return (
    <div className={`container ${theme}`}>
      <Sidebar
        chatHistories={chatHistories}
        onSelectChat={handlechats}
        onNewChat={resetChat}
        onDeleteChat={handleDeleteChat} // Pass the delete handler to Sidebar
      />

      <div className={`content ${theme}`}>
        <Navbar />
        <div className={`main-content ${theme}`}>
          {!chatStarted && <Cards onCardClick={startChat} />}

          <div className={`messages ${theme}`}>
            {/* Display messages from 'historia' if val == 1 */}
            {val === 1 &&
              historia
                .filter((message) => !shouldSkipMessage(message))
                .map((message, index) => (
                  <div key={index} className={`message-container ${theme}`}>
                    <div className={`message-name ${theme}`}>
                      {message.name}
                    </div>
                    <div className={`message-box ${theme}`}>
                      <p className={`message-content ${theme}`}>
                        {cleanMessageOutput(message.output)}
                      </p>
                      <small className={`message-date ${theme}`}>
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </small>
                    </div>
                  </div>
                ))}

            {/* Append localMessages to the display */}
            {localMessages
              .filter((message) => !shouldSkipMessage(message))
              .map((message, index) => (
                <div key={index} className={`message-container {theme}`}>
                  <div className={`message-name ${theme}`}>{message.name}</div>
                  <div className={`message-box ${theme}`}>
                    <p className={`message-content ${theme}`}>
                      {cleanMessageOutput(message.output)}
                    </p>
                    <small className={`message-date ${theme}`}>
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </small>
                  </div>
                </div>
              ))}
          </div>

          <div className={`input-container {theme}`}>
            <input
              autoFocus
              className={`message-input ${theme}`}
              placeholder="Type a message"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyUp={(e) => {
                if (e.key === "Enter") {
                  setChatStarted(true);
                  handleSendMessage(inputValue);
                }
              }}
            />
            <button
              onClick={
                isSending ? handleStopTask : () => handleSendMessage(inputValue)
              }
              className={`send-button ${theme}`}
              disabled={isSending && !stopTask}
            >
              {isSending ? (
                <StopCircleRoundedIcon style={{ fontSize: 24 }} />
              ) : (
                <SendRoundedIcon style={{ fontSize: 24 }} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
