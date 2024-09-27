import React, { useState } from "react";
import ViewSidebarRoundedIcon from "@mui/icons-material/ViewSidebarRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import "./sidebar.css";

export function Sidebar({ chatHistories, onSelectChat, onNewChat }) {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
      <div className="sidebar-toggle-icons">
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
        <div className="sidebar-content">
          <h3>Chat History</h3>
          <ul>
            {chatHistories.map((history) => (
              <li
                key={history.id}
                className="chat-history-item"
                onClick={() => onSelectChat(history.id)}
              >
                {history.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
