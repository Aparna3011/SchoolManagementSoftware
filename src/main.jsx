import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { ToastContainer } from 'react-toastify';


/**
 * React Entry Point
 */

const root = createRoot(document.getElementById('root'));
root.render(
  <StrictMode>
    <ToastContainer 
    position='top-left'
    autoClose={2000}
    // pauseOnHover={false}
    />
    <App />
  </StrictMode>
);
