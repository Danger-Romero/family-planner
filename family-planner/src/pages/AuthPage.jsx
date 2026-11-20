import { useState } from "react";
import { logIn, signUp } from "../services/authService.js";
import Button from "@mui/material/Button";

export default function AuthPage({ onAuthenticated }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      const user = await logIn(username.trim(), password);
      onAuthenticated(user);
    } catch (error) {
      setError(error.message || "Could not log in. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function handleSignUp() {
    setError("");
    setPending(true);

    try {
      const user = await signUp(username.trim(), password);
      onAuthenticated(user);
    } catch (error) {
      setError(error.message || "Could not sign up. Please try again.");
    } finally {
      setPending(false);
    }
  }

  const cannotSubmit =
    pending || username.trim().length === 0 || password.length === 0;

  return (
    <>
      <h1>Family planner</h1>
      <p>Log in or create an account to plan together with your family.</p>
      <form onSubmit={handleLogin}>
        <p>
          <label htmlFor="auth-username">Username</label>{" "}
          <input
            id="auth-username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            disabled={pending}
            required
          />
        </p>
        <p>
          <label htmlFor="auth-password">Password</label>{" "}
          <input
            id="auth-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={pending}
            required
          />
        </p>
        <Button
          type="submit"
          variant="contained"
          size="small"
          disabled={cannotSubmit}
        >
          Log in
        </Button>{" "}
        <Button
          type="button"
          variant="contained"
          size="small"
          onClick={handleSignUp}
          disabled={cannotSubmit}
        >
          Sign up
        </Button>
        {pending && <p role="status">Please wait...</p>}
        {error && <p role="alert">{error}</p>}
      </form>
    </>
  );
}
