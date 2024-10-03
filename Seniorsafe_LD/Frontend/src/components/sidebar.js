import React from "react";
import ViewSidebarRoundedIcon from "@mui/icons-material/ViewSidebarRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteIcon from "@mui/icons-material/Delete"; // Import DeleteIcon
import "./sidebar.css";
import { useTheme } from "./theme";

export function Sidebar({
  chatHistories = [],
  onSelectChat,
  onNewChat,
  onDeleteChat,
}) {
  const [isOpen, setIsOpen] = React.useState(true);
  const { theme } = useTheme(); // Access theme

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`sidebar ${isOpen ? "open" : "closed"} ${theme}`}>
      <div className={`sidebar-toggle-icons ${theme}`}>
        <ViewSidebarRoundedIcon
          style={{ fontSize: 30, cursor: "pointer" }}
          onClick={toggleSidebar}
        />
        <AddRoundedIcon
          style={{ fontSize: 30, cursor: "pointer" }}
          onClick={onNewChat} // Trigger reset when + is clicked
        />
      </div>
      {isOpen && (
        <div className={`sidebar-content ${theme}`}>
          <ul>
            {chatHistories.length > 0 ? (
              chatHistories.map((history) => (
                <div key={history.id} className="chat-history-container">
                  <li
                    className={`chat-history-item ${theme}`}
                    onClick={() => onSelectChat(history.id)}
                  >
                    {history.title}
                  </li>
                  <DeleteIcon
                    style={{ marginLeft: "10px", cursor: "pointer" }}
                    onClick={() => onDeleteChat(history.id)} // Call delete handler
                  />
                </div>
              ))
            ) : (
              <p>No chat history available</p>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
