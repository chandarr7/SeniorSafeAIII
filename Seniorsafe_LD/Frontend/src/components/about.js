import React from "react";
import { useNavigate } from "react-router-dom";
import "./about.css";

export function About() {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate("/playground"); // Navigate to Playground page
  };

  return (
    <div className="about-container">
      <div className="about-header">
        <h1 onClick={handleNavigate} className="about-logo">
          SeniorSafeAI
        </h1>
        <button onClick={handleNavigate} className="close-button">
          ✖
        </button>
      </div>
      <div className="about-content">
        <h2>About SeniorSafeAI</h2>
        <p>
          SeniorSafeAI is an AI-driven chatbot designed to assist senior
          citizens in combating cybercrimes. Our mission is to provide guidance,
          enhance cyber hygiene, and support victims of online scams through
          personalized, stigma-free assistance.
        </p>
        <p>
          With a focus on transparency and real-time updates, SeniorSafeAI
          leverages cutting-edge AI technologies to ensure effective responses
          and better support for senior citizens.
        </p>
        <p>
          Together, we aim to reduce the impact of cybercrimes and empower
          seniors with the knowledge and tools to stay safe online.
        </p>
      </div>
    </div>
  );
}
