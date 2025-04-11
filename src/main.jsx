import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import AppRouter from './AppRouter'
import { initializeApp } from 'firebase/app';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBHy56LDPFQ__56EgCCVnWEFrODdPFlgnw",
  authDomain: "ai-dental-assistant-e758a.firebaseapp.com",
  projectId: "ai-dental-assistant-e758a",
  storageBucket: "ai-dental-assistant-e758a.firebasestorage.app",
  messagingSenderId: "53910361522",
  appId: "1:53910361522:web:b999036ad513bad95300ab",
  measurementId: "G-1MPKSVFXY5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
)