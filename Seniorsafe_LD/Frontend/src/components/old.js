import { useState, useEffect } from "react";
import "./playground.css";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";
import { useChatInteract, useChatMessages } from "@chainlit/react-client";
import { Cards } from "./card";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import StopCircleRoundedIcon from "@mui/icons-material/StopCircleRounded";
import { firestore, auth } from "./firebase";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";

export function Playground() {
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [localMessages, setLocalMessages] = useState([]);
  const [chatHistories, setChatHistories] = useState([]);
  const [userId, setUserId] = useState(null);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false); // Track if an operation is ongoing

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
          title: `Chat Session ${chatHistories.length + 1}`,
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
    // Prevent multiple clicks
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // Save the chat first
      const savedSuccessfully = await saveChatToFirebase();
      if (savedSuccessfully) {
        // Once saved, stop the task and reset the chat
        await handleStopTask();
        setChatStarted(false);
        setLocalMessages([]); // Clear the messages
        setInputValue(""); // Clear the input
        await clear(); // Clear the backend chat session
      }
    } finally {
      setIsProcessing(false); // Ensure this is reset to allow future actions
    }
  };

  const loadChatFromFirebase = async (chatId) => {
    try {
      const chatRef = doc(firestore, "chatHistories", chatId);
      const chatDoc = await getDoc(chatRef);

      if (chatDoc.exists()) {
        const chatData = chatDoc.data();
        setLocalMessages(chatData.messages || []);
        setChatStarted(true);
        setCurrentChatId(chatId);
      } else {
        console.error("No such chat history found!");
      }
    } catch (error) {
      console.error("Error loading chat from Firebase:", error);
    }
  };

  return (
    <div className="container">
      <Sidebar
        chatHistories={chatHistories}
        onSelectChat={loadChatFromFirebase}
        onNewChat={resetChat}
      />

      <div className="content">
        <Navbar />
        <div className="main-content">
          {!chatStarted && <Cards onCardClick={startChat} />}

          <div className="messages">
            {localMessages
              .filter((message) => !shouldSkipMessage(message))
              .map((message, index) => (
                <div key={index} className="message-container">
                  <div className="message-name">{message.name}</div>
                  <div className="message-box">
                    <p className="message-content">
                      {cleanMessageOutput(message.output)}
                    </p>
                    <small className="message-date">
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </small>
                  </div>
                </div>
              ))}
          </div>

          <div className="input-container">
            <input
              autoFocus
              className="message-input"
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
              className="send-button"
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
