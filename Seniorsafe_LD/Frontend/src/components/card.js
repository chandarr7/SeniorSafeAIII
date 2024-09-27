// src/Card.js
import React from "react";
import "./card.css";

export function Card({ label, image, onClick }) {
  return (
    <div className="card" onClick={onClick}>
      <img src={image} alt={label} className="card-image" />
      <p>{label}</p>
    </div>
  );
}

export function Cards({ onCardClick }) {
  const cardData = [
    {
      label: "Identity stolen",
      message:
        "What should I do if my identity has been stolen in an online scam?",
      image: "/identity_theft.png", // Image for Identity stolen
    },
    {
      label: "Financial Loss",
      message: "How can I recover money lost to a scammer?",
      image: "/financial_loss.png", // Image for Financial Loss
    },
    {
      label: "Protecting accounts",
      message: "How can I protect my bank accounts after being scammed?",
      image: "/protect_accounts.png", // Image for Protecting accounts
    },
    {
      label: "Reporting a Scam",
      message: "Who should I report a cyber scam to?",
      image: "/report_scam.png", // Image for Reporting a Scam
    },
  ];

  return (
    <div className="cards-container">
      {cardData.map((card, index) => (
        <Card
          key={index}
          label={card.label}
          image={card.image}
          onClick={() => onCardClick(card.message)}
        />
      ))}
    </div>
  );
}
