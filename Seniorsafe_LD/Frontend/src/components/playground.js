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
  updateDoc,
  getDocs,
} from "firebase/firestore";

//let val = 0;
//let chaid;

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
  const [cal1, setcal1] = useState(0);
  const { sendMessage, stopTask, clear } = useChatInteract();
  const { messages } = useChatMessages();
  const [chaid, setChaid] = useState(null);
  const [val, setval] = useState(0);
  const [k, setk] = useState(0);
  const [serveMessage, setServeMessage] = useState([]);
  const [userMessage, setuserMessage] = useState({
    name: "user",
    type: "user_message",
    output: "",
  });

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
  const removeUndefinedFields = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map(removeUndefinedFields); // Clean arrays recursively
    } else if (obj !== null && typeof obj === "object") {
      return Object.fromEntries(
        Object.entries(obj)
          .filter(([_, v]) => v !== undefined) // Remove undefined fields
          .map(([k, v]) => [k, removeUndefinedFields(v)]) // Clean nested objects
      );
    }
    return obj;
  };
  useEffect(() => {
    // setval(1);
    if (userMessage.output) {
      console.log("inside u");
      saveMessage();
      //setuserMessage({ name: "user", type: "user_message", output: "" });
      setk(1);
      // setuserMessage([]);
    }
  }, [userMessage]);
  const saveMessage = async () => {
    console.log("inside s");
    if (userMessage.output && userId) {
      console.log("inside s1");

      try {
        const cleanedMessages = [removeUndefinedFields(userMessage)];
        if (k === 1 && chaid) {
        } else {
          const newChat = {
            userId: userId || "unknownUser", // Ensure userId is valid
            messages: cleanedMessages, // Use cleaned messages array
            title:
              (cleanedMessages[0] && cleanedMessages[0].output) ||
              `Chat Session ${chatHistories.length + 1}`, // Fallback title
            createdAt: new Date(),
          };
          console.log(
            "Attempting to save cleaned chat data to Firebase:",
            newChat
          );
          console.log("Contents of 'historia' before saving:", historia);

          const chatRef = await addDoc(
            collection(firestore, "chatHistories"),
            newChat
          );
          const newChatId = chatRef.id;

          // Update chatHistories and set current chat ID
          setChatHistories((prevHistories) => [
            ...prevHistories,
            { id: newChatId, title: newChat.title },
          ]);
          setCurrentChatId(newChatId);
          setChaid(newChatId);
          setk(1);
          console.log(chaid);
          return true;
        }
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
      setcal1(1);
      setIsSending(true);
      const message = {
        name: "user",
        type: "user_message",
        output: content,
      };
      try {
        //console.log("message is",localMessages[localMessages.length - 1]);
        // await saveServeChanges();
        setuserMessage(message);
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
      //saveChatToFirebase();
      setIsSending(false);
    } catch (error) {
      console.error("Error stopping task:", error);
    }
  };
  const saveChatToFirebase = async () => {
    if (localMessages.length > 0 && userId) {
      try {
        // Clean messages array
        const cleanedMessages = localMessages.map(removeUndefinedFields);
        if (val === 1 && chaid) {
          // Append to existing chat when val === 1
          const chatRef = doc(firestore, "chatHistories", chaid);
          const chatDoc = await getDoc(chatRef);

          if (chatDoc.exists()) {
            const existingMessages = chatDoc.data().messages || [];
            const updatedMessages = [...historia, ...cleanedMessages];

            // Update the document with new messages
            await updateDoc(chatRef, { messages: updatedMessages });

            console.log("Appended messages to existing chat:", chaid);
          } else {
            console.error("No such chat history found for chaid:", chaid);
          }
        } else {
          if (chaid != null) {
            const chatRef = doc(firestore, "chatHistories", chaid);
            await updateDoc(chatRef, { messages: cleanedMessages });
            console.log("Overwritten messages in existing chat:", chaid);
          }
        }
      } catch (error) {
        console.error("Error saving chat to Firebase:", error);
        return false;
      }

      return true; // Proceed if no messages to save
    }
  };
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      // console.log("message:recieved is", messages);
      //console.log("local message is", localMessages);
      saveChatToFirebase();
      if (lastMessage.output.includes("&*&8")) {
        // saveChatToFirebase();
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
      // if (cal1 === 1) {
      // const savedSuccessfully = await saveChatToFirebase();
      //if (savedSuccessfully) {
      setval(0);
      //}

      //setcal1(0);
      // }

      //  if (savedSuccessfully) {
      await handleStopTask();
      setChaid(null);
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
      setChaid(null);
      // Update local chat histories after deletion
      setChatHistories((prevHistories) =>
        prevHistories.filter((history) => history.id !== chatId)
      );
      setcal1(0);
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
      setval(1);
      setChaid(chatId);
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
    // if (cal1 === 1) {
    // await saveChatToFirebase();
    //}
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
