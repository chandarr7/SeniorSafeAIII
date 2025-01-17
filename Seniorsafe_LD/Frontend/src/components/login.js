import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "./firebase";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import "./login.css";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/playground");
    } catch (error) {
      setError("Failed to login. Please check your credentials.");
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme); // Save the theme to localStorage
  };

  return (
    <div className={`login-container ${theme}`}>
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

      <h2>Login</h2>
      <form onSubmit={handleLogin} className="login-form">
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
        <button type="submit">Login</button>
        {error && <p className="error">{error}</p>}
      </form>
      <div className="login-links">
        <Link to="/password">Forgot Password?</Link>
        <Link to="/signup">Sign Up</Link>
      </div>
    </div>
  );
}
