import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import "./signup.css";

export function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
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

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      await signOut(auth);
      setSuccess(true);
    } catch (error) {
      setError("Failed to create an account. Try again.");
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme); // Save the theme to localStorage
  };

  return (
    <div className={`signup-container ${theme}`}>

      {/* Logo and Theme Toggle */}
      <div className="logo">
        <img
          src="/favicon.png" // Ensure the logo is in the public folder
          alt="SeniorSafeAI Logo"
          className="logo-image"
        />
        <h1>SeniorSafeAI</h1>

      </div>
      <div className="theme-toggle" onClick={toggleTheme}>
        {theme === "light" ? (
          <DarkModeIcon style={{ color: "#000000" }} /> // Dark icon for light mode
        ) : (
          <LightModeIcon style={{ color: "#ffffff" }} /> // Light icon for dark mode
        )}
      </div>

      <h2>Sign Up</h2>
      {success ? (
        <div className="success-message">
          <p>Signup successful! Please click the button below to log in.</p>
          <button onClick={() => navigate("/")}>Go to Login</button>
        </div>
      ) : (
        <form onSubmit={handleSignup} className="signup-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Sign Up</button>
          {error && <p className="error">{error}</p>}
        </form>
      )}
    </div>
  );
}
