import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Game from './components/Game';
import ChatInterface from './components/ChatInterface';
import { Toaster } from "@/components/ui/sonner";
import PuzzlePage from "./pages/PuzzlePage";

export type UserType = 'boy' | 'girl' | null;

const App = () => {
  const [user, setUser] = useState<UserType>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check session
    const storedUser = localStorage.getItem('chat_user');
    if (storedUser === 'boy' || storedUser === 'girl') {
      setUser(storedUser as UserType);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (userType: 'boy' | 'girl') => {
    setUser(userType);
    localStorage.setItem('chat_user', userType);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('chat_user');
  };

  if (isLoading) return null;

  return (
    <>
      <Routes>
        <Route path="/" element={user ? <ChatInterface user={user} onLogout={handleLogout} /> : <Game onLogin={handleLogin} />} />
        <Route path="/puzzle" element={<PuzzlePage />} />
      </Routes>
      <Toaster />
    </>
  );
};

export default App;
