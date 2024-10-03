import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Password } from "./components/password";
import { Signup } from "./components/signup";
import { Login } from "./components/login";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./components/firebase";
import { sessionState, useChatSession } from "@chainlit/react-client";
//import { Playground } from "./components/playground";
import { useRecoilValue } from "recoil";
import { Playground } from "./components/playground";
import { ThemeProvider } from "./components/theme"; // Import ThemeProvider
const userEnv = {};

function App() {
  const [user, loading, error] = useAuthState(auth);

  const { connect } = useChatSession();

  const session = useRecoilValue(sessionState);
  useEffect(() => {
    if (session?.socket.connected) {
      console.log("session connected");
      return;
    }
    fetch("http://localhost:80/custom-auth")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Received token:", data); // Log the received token
        connect({
          userEnv,
          accessToken: `Bearer: ${data.token}`,
        });
      })
      .catch((error) => {
        console.error("Error fetching custom-auth:", error);
      });
  }, [connect]);

  if (loading) {
    return <p>Loading...</p>; // Show a loading indicator while checking auth status
  }

  if (error) {
    return <p>Error: {error.message}</p>; // Show error if there's a problem with auth
  }
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route
            path="/"
            element={user ? <Navigate to="/playground" /> : <Login />}
          />
          <Route path="/signup" element={<Signup />} />
          <Route path="/password" element={<Password />} />
          <Route
            path="/playground"
            element={user ? <Playground /> : <Navigate to="/" />}
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
