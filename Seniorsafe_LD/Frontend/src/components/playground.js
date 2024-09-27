import { useState, useEffect } from "react";
import "./playground.css";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";
import { useChatInteract, useChatMessages } from "@chainlit/react-client";
import { Cards } from "./card"; // Import Cards
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import StopCircleRoundedIcon from "@mui/icons-material/StopCircleRounded"; // Import Stop Icon

export function Playground() {
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false); // Track sending state
  const [chatStarted, setChatStarted] = useState(false); // Track if chat started
  const [localMessages, setLocalMessages] = useState([]); // Local state to manage messages

  const { sendMessage, stopTask, clear } = useChatInteract(); // Use clear to reset backend chat state
  const { messages } = useChatMessages(); // Hook to receive chat messages

  const chatHistories = [
    { id: 1, title: "Chat Session 1" },
    { id: 2, title: "Chat Session 2" },
    { id: 3, title: "Chat Session 3" },
  ];

  // Handle sending the user message
  const handleSendMessage = async (content) => {
    if (isSending) {
      // If currently receiving a response, stop the task first before sending the new message
      await handleStopTask();
    }

    if (content) {
      setIsSending(true); // Show stop button during sending
      const message = {
        name: "user",
        type: "user_message",
        output: content,
      };
      try {
        await sendMessage(message, []); // Send message to backend
        setLocalMessages((prevMessages) => [...prevMessages, message]); // Add user message to local state
      } catch (error) {
        console.error("Error sending message:", error);
      }
      setInputValue(""); // Clear input field
    }
  };

  // Handle stopping the task when stop button is clicked
  const handleStopTask = async () => {
    try {
      await stopTask(); // Stop the current task
      setIsSending(false); // Revert back to send button
    } catch (error) {
      console.error("Error stopping task:", error);
    }
  };

  // Detect backend response completion to revert back to send button
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.output.includes("&*&8")) {
        setIsSending(false); // Revert back to send button when backend response is complete
      }
      setLocalMessages([...messages]); // Sync local state with backend messages
    }
  }, [messages]);

  // Clean up the message to remove special markers like &*&8
  const cleanMessageOutput = (output) => {
    return output.replace("&*&8", "");
  };

  const shouldSkipMessage = (message) => {
    return message.output.includes("Task manually stopped");
  };

  // Trigger sending message when the card is clicked
  const startChat = (message) => {
    setChatStarted(true);
    handleSendMessage(message);
  };

  // Reset chat state when the "+" button is clicked
  const resetChat = async () => {
    setChatStarted(false); // Show cards again
    setLocalMessages([]); // Clear all messages
    setInputValue(""); // Clear input field
    await clear(); // Clear the backend chat session completely
  };

  return (
    <div className="container">
      <Sidebar
        chatHistories={chatHistories}
        onSelectChat={() => {}}
        onNewChat={resetChat} // Trigger the resetChat function on new chat
      />

      <div className="content">
        <Navbar />
        <div className="main-content">
          {/* Render Cards initially before chat starts */}
          {!chatStarted && <Cards onCardClick={startChat} />}

          {/* Messages Section */}
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

          {/* Input Section - Always visible */}
          <div className="input-container">
            <input
              autoFocus
              className="message-input"
              placeholder="Type a message"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyUp={(e) => {
                if (e.key === "Enter") {
                  setChatStarted(true); // Hide cards when message is sent
                  handleSendMessage(inputValue);
                }
              }}
            />
            <button
              onClick={
                isSending ? handleStopTask : () => handleSendMessage(inputValue)
              } // Handle stop/send action
              className="send-button"
              disabled={isSending && !stopTask} // Disable if sending and no stopTask available
            >
              {isSending ? (
                <StopCircleRoundedIcon style={{ fontSize: 24 }} /> // Show Stop icon while waiting
              ) : (
                <SendRoundedIcon style={{ fontSize: 24 }} /> // Show Send icon normally
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
