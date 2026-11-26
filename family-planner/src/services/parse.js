import Parse from "parse";

// Vite reads these values from .env.local. See .env.example.
const env = import.meta.env ?? {};

export const parseConfigured = Boolean(
  env.VITE_PARSE_APP_ID &&
    env.VITE_PARSE_JS_KEY &&
    env.VITE_PARSE_SERVER_URL &&
    env.VITE_PARSE_APP_ID !== "your-application-id-here" &&
    env.VITE_PARSE_JS_KEY !== "your-javascript-key-here",
);

if (parseConfigured) {
  Parse.initialize(env.VITE_PARSE_APP_ID, env.VITE_PARSE_JS_KEY);
  Parse.serverURL = env.VITE_PARSE_SERVER_URL;
}

export default Parse;
