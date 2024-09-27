// src/password.js
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import "./password.css";

export function Password() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent!");
      setError(null);
      // Redirect to login page after successful reset email
      setTimeout(() => {
        navigate("/");
      }, 2000); // Redirect after a short delay to let the user see the message
    } catch (error) {
      setError("Failed to send password reset email.");
      setMessage(null);
    }
  };

  return (
    <div className="password-container">
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
