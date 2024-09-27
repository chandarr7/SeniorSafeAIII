// src/signup.js
import { useState } from "react";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import "./signup.css";

export function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      // Create the user account
      await createUserWithEmailAndPassword(auth, email, password);

      // Sign the user out immediately after signup
      await signOut(auth);

      // Redirect to the login page after signing out
      navigate("/");
    } catch (error) {
      setError("Failed to create an account. Try again.");
    }
  };

  return (
    <div className="signup-container">
      <h2>Sign Up</h2>
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
    </div>
  );
}
