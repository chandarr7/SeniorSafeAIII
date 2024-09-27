import React from "react";
import "./navbar.css";
import { Profile } from "./profile";
export function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">SeniorSafeAI</div>
      <div className="navbar-links">
        <Profile />
      </div>
    </nav>
  );
}
