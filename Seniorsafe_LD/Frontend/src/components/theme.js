import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, firestore } from "./firebase"; // Firebase setup
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

// Create ThemeContext
const ThemeContext = createContext();

// Custom hook to access ThemeContext
export const useTheme = () => useContext(ThemeContext);

// ThemeProvider component that provides theme state to the whole app
export const ThemeProvider = ({ children }) => {
  const [user] = useAuthState(auth);
  const [theme, setTheme] = useState("light"); // Default to light theme

  // Fetch theme from Firebase on user login
  useEffect(() => {
    if (user) {
      const fetchTheme = async () => {
        const userDocRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.theme) {
            setTheme(userData.theme); // Set the theme from Firebase
            document.body.className = userData.theme; // Apply theme globally
          }
        }
      };
      fetchTheme();
    }
  }, [user]);

  // Toggle theme and save it to Firebase
  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.body.className = newTheme; // Apply theme to body

    if (user) {
      const userDocRef = doc(firestore, "users", user.uid);
      await setDoc(userDocRef, { theme: newTheme }, { merge: true }); // Save theme to Firebase
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
