// src/profile.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "./firebase"; // Ensure firebase is correctly set up in your project
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import "./profile.css";

export function Profile() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleSettings = () => {
    // Handle settings logic here
    console.log("Settings clicked");
  };

  const handleLogout = () => {
    // Firebase logout function
    signOut(auth)
      .then(() => {
        // Successfully logged out
        navigate("/"); // Redirect to the login page
      })
      .catch((error) => {
        console.error("Error logging out: ", error);
      });
  };
  const handleAbout = () => {
    navigate("/about"); // Navigate to the About page
  };
  return (
    <div className="profile-container">
      <div className="profile-icon" onClick={toggleDropdown}>
        <PersonRoundedIcon style={{ fontSize: 30, cursor: "pointer" }} />
      </div>
      {isOpen && (
        <div className="dropdown-menu">
          <ul>
            <li onClick={handleSettings}>Settings</li>
            <li onClick={handleAbout}>About</li>
            <li onClick={handleLogout}>Logout</li>
          </ul>
        </div>
      )}
    </div>
  );
}
