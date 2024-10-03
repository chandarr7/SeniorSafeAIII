import { useState, useEffect } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import "./password.css";

export function Password() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState("light"); // Default to light mode
  const navigate = useNavigate();

  useEffect(() => {
    // Check localStorage for theme preference
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Apply the theme class to the body
    document.body.className = theme;
  }, [theme]);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent!");
      setError(null);
      // Redirect to login page after a short delay
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      setError("Failed to send password reset email.");
      setMessage(null);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme); // Save the theme to localStorage
  };

  return (
    <div className={`password-container ${theme}`}>
      {/* Theme Toggle Button at Top Right */}
      <div className="theme-toggle" onClick={toggleTheme}>
        {theme === "light" ? (
          <DarkModeIcon style={{ color: "#000000" }} /> // Dark icon for light mode
        ) : (
          <LightModeIcon style={{ color: "#ffffff" }} /> // Light icon for dark mode
        )}
      </div>

      <h2>Reset Password</h2>
      <form onSubmit={handlePasswordReset} className="password-form">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit">Send Reset Link</button>
        {message && <p className="message">{message}</p>}
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}
