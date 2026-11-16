import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@mui/material/styles'
import './tokens/generated/tokens.css'
import './index.css'
import { theme } from './theme'
import { BrowserRouter } from "react-router-dom";
import App from './App.jsx'



createRoot(document.getElementById("root")).render(
  <StrictMode>
    
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
