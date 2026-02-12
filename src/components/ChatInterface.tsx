import React, { useState, useEffect } from 'react';
import { UserType } from '../App';
import ChatWindow from './ChatWindow';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, Search, Phone, Video, MoreVertical } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps {
  user: UserType;
  onLogout: () => void;
}

export interface Message {
  id: string;
  text: string;
  sender: 'boy' | 'girl';
  timestamp: number;
  type: 'text' | 'image' | 'call_log';
  replyTo?: Message;
  isDeleted?: boolean;
  isEdited?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ user, onLogout }) => {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // The "other" person details
  const otherPerson = user === 'boy' ? 'girl' : 'boy';
  const otherName = user === 'boy' ? 'Asthipanjaram' : 'Bachii'; // Using the code names or aliases
  
  // Load messages
  useEffect(() => {
    const loadMessages = () => {
      const stored = localStorage.getItem('chat_messages');
      if (stored) {
        setMessages(JSON.parse(stored));
      }
    };
    
    loadMessages();
    
    // Poll for new messages (simulate real-time)
    const interval = setInterval(loadMessages, 1000);
    return () => clearInterval(interval);
  }, []);

  const saveMessages = (newMessages: Message[]) => {
    localStorage.setItem('chat_messages', JSON.stringify(newMessages));
    setMessages(newMessages);
  };

  const handleSendMessage = (text: string, type: 'text' | 'image' = 'text', replyTo?: Message) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: user!,
      timestamp: Date.now(),
      type,
      replyTo
    };
    saveMessages([...messages, newMessage]);
  };

  const handleDeleteMessage = (id: string) => {
    const updated = messages.map(m => 
      m.id === id ? { ...m, isDeleted: true, text: "🚫 This message was deleted" } : m
    );
    saveMessages(updated);
  };

  const handleEditMessage = (id: string, newText: string) => {
    const updated = messages.map(m => 
      m.id === id ? { ...m, text: newText, isEdited: true } : m
    );
    saveMessages(updated);
  };

  // Mobile: if activeChat is null, show list. If set, show window.
  // Desktop: Show both.

  const lastMessage = messages[messages.length - 1];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar / Chat List */}
      <div className={cn(
        "w-full md:w-[400px] flex flex-col border-r border-border bg-card",
        activeChat ? "hidden md:flex" : "flex"
      )}>
        {/* Header */}
        <div className="p-4 bg-secondary flex justify-between items-center border-b border-border">
          <Avatar className="h-10 w-10 cursor-pointer" onClick={onLogout}>
             <AvatarFallback>{user === 'boy' ? 'B' : 'G'}</AvatarFallback>
          </Avatar>
          <div className="flex gap-4">
            <Button variant="ghost" size="icon"><Search className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" onClick={onLogout}><LogOut className="h-5 w-5" /></Button>
          </div>
        </div>

        {/* Chat List Item */}
        <div 
          className="flex items-center gap-4 p-4 hover:bg-secondary/50 cursor-pointer transition-colors border-b border-border/10"
          onClick={() => setActiveChat(otherPerson)}
        >
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {otherName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline mb-1">
              <h3 className="font-semibold text-foreground truncate">{otherName}</h3>
              {lastMessage && (
                <span className="text-xs text-muted-foreground">
                  {format(lastMessage.timestamp, 'HH:mm')}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {lastMessage ? (lastMessage.sender === user ? `You: ${lastMessage.text}` : lastMessage.text) : "Tap to start chatting"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Chat Window */}
      <div className={cn(
        "flex-1 flex flex-col bg-[#0b141a]", // WhatsApp dark background color
        !activeChat ? "hidden md:flex items-center justify-center" : "flex"
      )}>
        {activeChat ? (
          <ChatWindow 
            chatPartner={otherName}
            messages={messages}
            currentUser={user!}
            onBack={() => setActiveChat(null)}
            onSendMessage={handleSendMessage}
            onDeleteMessage={handleDeleteMessage}
            onEditMessage={handleEditMessage}
          />
        ) : (
          <div className="text-center p-8 text-muted-foreground hidden md:block">
            <h2 className="text-2xl font-light mb-4">Select a chat to start messaging</h2>
            <div className="w-64 h-64 bg-secondary/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Search className="h-12 w-12 opacity-20" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
