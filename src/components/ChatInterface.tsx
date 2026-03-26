import React, { useState, useEffect, useCallback } from 'react';
import { UserType } from '../App';
import ChatWindow from './ChatWindow';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, Search } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface ChatInterfaceProps {
  user: UserType;
  onLogout: () => void;
}

export interface Message {
  id: string;
  text: string;
  sender: 'boy' | 'girl';
  timestamp: number;
  type: 'text' | 'image' | 'voice' | 'call_log';
  replyTo?: Message;
  replyToId?: string;
  isDeleted?: boolean;
  isEdited?: boolean;
  status: 'sent' | 'delivered' | 'seen';
  voiceDuration?: number;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ user, onLogout }) => {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const otherPerson = user === 'boy' ? 'girl' : 'boy';
  const otherName = user === 'boy' ? 'Bhavya' : 'Vamsi';

  // Fetch messages from Supabase
  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    if (data) {
      const msgs: Message[] = data.map((row: any) => ({
        id: row.id,
        text: row.text,
        sender: row.sender as 'boy' | 'girl',
        timestamp: new Date(row.created_at).getTime(),
        type: row.type as Message['type'],
        replyToId: row.reply_to_id,
        isDeleted: row.is_deleted,
        isEdited: row.is_edited,
        status: row.status as Message['status'],
        voiceDuration: row.voice_duration,
      }));

      // Resolve reply references
      const msgMap = new Map(msgs.map(m => [m.id, m]));
      for (const msg of msgs) {
        if (msg.replyToId) {
          msg.replyTo = msgMap.get(msg.replyToId);
        }
      }

      setMessages(msgs);
    }
  }, []);

  // Mark messages as seen
  const markAsSeen = useCallback(async () => {
    if (!activeChat) return;
    const unseenIds = messages
      .filter(m => m.sender === otherPerson && m.status !== 'seen')
      .map(m => m.id);

    if (unseenIds.length > 0) {
      await supabase
        .from('messages')
        .update({ status: 'seen' })
        .in('id', unseenIds);
    }
  }, [activeChat, messages, otherPerson]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('messages-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessages]);

  // Mark as seen when chat is open
  useEffect(() => {
    if (activeChat) {
      markAsSeen();
    }
  }, [activeChat, messages, markAsSeen]);

  const handleSendMessage = async (
    text: string,
    type: 'text' | 'image' | 'voice' = 'text',
    replyTo?: Message,
    voiceDuration?: number
  ) => {
    const { error } = await supabase.from('messages').insert({
      text,
      sender: user!,
      type,
      reply_to_id: replyTo?.id || null,
      voice_duration: voiceDuration || null,
      status: 'sent',
    });

    if (error) {
      console.error('Error sending message:', error);
      return;
    }

    // Simulate delivered after 1s
    setTimeout(async () => {
      // Fetch latest to get the message id
      const { data } = await supabase
        .from('messages')
        .select('id')
        .eq('sender', user!)
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data[0]) {
        await supabase
          .from('messages')
          .update({ status: 'delivered' })
          .eq('id', data[0].id)
          .eq('status', 'sent');
      }
    }, 1000);
  };

  const handleDeleteMessage = async (id: string) => {
    await supabase
      .from('messages')
      .update({ is_deleted: true, text: '🚫 This message was deleted' })
      .eq('id', id);
  };

  const handleEditMessage = async (id: string, newText: string) => {
    await supabase
      .from('messages')
      .update({ text: newText, is_edited: true })
      .eq('id', id);
  };

  const lastMessage = messages[messages.length - 1];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className={cn(
        "w-full md:w-[400px] flex flex-col border-r border-border bg-card",
        activeChat ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 bg-secondary flex justify-between items-center border-b border-border">
          <Avatar className="h-10 w-10 cursor-pointer" onClick={onLogout}>
             <AvatarFallback>{user === 'boy' ? 'V' : 'B'}</AvatarFallback>
          </Avatar>
          <div className="flex gap-4">
            <Button variant="ghost" size="icon"><Search className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" onClick={onLogout}><LogOut className="h-5 w-5" /></Button>
          </div>
        </div>

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
              {lastMessage 
                ? (lastMessage.type === 'voice' 
                    ? (lastMessage.sender === user ? 'You: 🎤 Voice note' : '🎤 Voice note')
                    : (lastMessage.sender === user ? `You: ${lastMessage.text}` : lastMessage.text))
                : "Tap to start chatting"}
            </p>
          </div>
        </div>
      </div>

      <div className={cn(
        "flex-1 flex flex-col bg-[#0b141a]",
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
