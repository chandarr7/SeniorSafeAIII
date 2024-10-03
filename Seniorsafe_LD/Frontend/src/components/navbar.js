import React from "react";
import "./navbar.css"; // Import the common styles
import { Profile } from "./profile";
import { useTheme } from "./theme"; // Import useTheme
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

export function Navbar() {
  const { theme, toggleTheme } = useTheme(); // Access theme and toggle function

  return (
    <nav className={`navbar ${theme}`}>
      {" "}
      {/* Apply light or dark class based on the theme */}
      <div className="navbar-brand">SeniorSafeAI</div>
      <div className="navbar-links">
        <button onClick={toggleTheme} className="theme-toggle">
          {theme === "light" ? <DarkModeIcon /> : <LightModeIcon />}
        </button>
        <Profile />
      </div>
    </nav>
  );
}
