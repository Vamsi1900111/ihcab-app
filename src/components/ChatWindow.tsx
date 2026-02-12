import React, { useState, useRef, useEffect } from 'react';
import { Message } from './ChatInterface';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  ArrowLeft, Phone, Video, MoreVertical, Paperclip, 
  Smile, Mic, Send, X, Edit2, Trash2, Reply, Languages 
} from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import MessageTicks from './MessageTicks';
import VoiceNoteRecorder from './VoiceNoteRecorder';
import VoiceNotePlayer from './VoiceNotePlayer';

interface ChatWindowProps {
  chatPartner: string;
  messages: Message[];
  currentUser: 'boy' | 'girl';
  onBack: () => void;
  onSendMessage: (text: string, type?: 'text' | 'image' | 'voice', replyTo?: Message, voiceDuration?: number) => void;
  onDeleteMessage: (id: string) => void;
  onEditMessage: (id: string, newText: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  chatPartner, messages, currentUser, onBack, onSendMessage, onDeleteMessage, onEditMessage 
}) => {
  const [inputText, setInputText] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCalling, setIsCalling] = useState<'voice' | 'video' | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    
    if (editingId) {
      onEditMessage(editingId, inputText);
      setEditingId(null);
    } else {
      onSendMessage(inputText, 'text', replyingTo || undefined);
    }
    
    setInputText("");
    setReplyingTo(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onSendMessage(url, 'image');
    }
  };

  const handleVoiceSend = (audioUrl: string, duration: number) => {
    onSendMessage(audioUrl, 'voice', replyingTo || undefined, duration);
    setIsRecordingVoice(false);
    setReplyingTo(null);
  };

  const startCall = (type: 'voice' | 'video') => {
    setIsCalling(type);
    toast.info(`Calling ${chatPartner}...`);
  };

  const translateMessage = async (msgId: string, text: string) => {
    setTranslatingId(msgId);
    try {
      // Use MyMemory free translation API - auto-detect to English
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect|en`);
      const data = await res.json();
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        const translated = data.responseData.translatedText;
        toast.success(`Translation: ${translated}`, { duration: 8000 });
      } else {
        toast.error("Could not translate this message");
      }
    } catch {
      toast.error("Translation failed");
    }
    setTranslatingId(null);
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Chat Header */}
      <div className="bg-secondary p-3 flex items-center justify-between border-b border-border z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar>
            <AvatarFallback>{chatPartner[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold">{chatPartner}</span>
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => startCall('voice')}>
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => startCall('video')}>
            <Video className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toast.info("Contact info")}>View Contact</DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Search")}>Search</DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Wallpaper")}>Wallpaper</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => toast.info("Blocked")}>Block</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-fixed opacity-95">
        {messages.map((msg) => {
          const isOwn = msg.sender === currentUser;
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex w-full",
                isOwn ? "justify-end" : "justify-start"
              )}
            >
              <div 
                className={cn(
                  "max-w-[80%] rounded-lg p-3 shadow-sm relative group",
                  isOwn ? "bg-chat-own text-primary-foreground rounded-tr-none" : "bg-chat-peer text-foreground rounded-tl-none",
                  msg.isDeleted && "italic opacity-70"
                )}
              >
                {/* Reply Context */}
                {msg.replyTo && (
                  <div className="mb-2 p-2 rounded bg-black/20 text-xs border-l-4 border-primary/50 truncate">
                    <span className="font-bold block opacity-70">
                      {msg.replyTo.sender === currentUser ? "You" : chatPartner}
                    </span>
                    {msg.replyTo.type === 'image' ? '📷 Photo' : msg.replyTo.type === 'voice' ? '🎤 Voice note' : msg.replyTo.text}
                  </div>
                )}

                {/* Message Content */}
                {msg.type === 'image' ? (
                  <img src={msg.text} alt="Shared" className="rounded-md max-w-full h-auto max-h-[300px]" />
                ) : msg.type === 'voice' ? (
                  <VoiceNotePlayer src={msg.text} duration={msg.voiceDuration} />
                ) : (
                  <p className="text-sm md:text-base leading-relaxed break-words">{msg.text}</p>
                )}

                {/* Metadata */}
                <div className="flex items-center justify-end gap-1 mt-1 opacity-70">
                   {msg.isEdited && <span className="text-[10px] mr-1">edited</span>}
                   <span className="text-[10px]">{format(msg.timestamp, 'HH:mm')}</span>
                   {isOwn && <MessageTicks status={msg.status} />}
                </div>

                {/* Actions Dropdown */}
                {!msg.isDeleted && (
                  <div className={cn(
                    "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 rounded-full shadow-md",
                    isOwn ? "-left-10" : "-right-10"
                  )}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setReplyingTo(msg)}>
                          <Reply className="h-4 w-4 mr-2" /> Reply
                        </DropdownMenuItem>
                        {msg.type === 'text' && (
                          <DropdownMenuItem 
                            onClick={() => translateMessage(msg.id, msg.text)}
                            disabled={translatingId === msg.id}
                          >
                            <Languages className="h-4 w-4 mr-2" /> 
                            {translatingId === msg.id ? 'Translating...' : 'Translate to English'}
                          </DropdownMenuItem>
                        )}
                        {isOwn && (
                          <>
                            {msg.type === 'text' && (
                              <DropdownMenuItem onClick={() => {
                                setInputText(msg.text);
                                setEditingId(msg.id);
                              }}>
                                <Edit2 className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => onDeleteMessage(msg.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-secondary p-2 flex flex-col gap-2 z-20">
        <AnimatePresence>
          {replyingTo && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-background/50 p-2 rounded-t-lg flex justify-between items-center border-l-4 border-primary"
            >
              <div className="text-sm">
                <span className="font-bold text-primary text-xs block">
                  Replying to {replyingTo.sender === currentUser ? "You" : chatPartner}
                </span>
                <span className="text-muted-foreground text-xs truncate max-w-[200px] block">
                  {replyingTo.type === 'image' ? '📷 Photo' : replyingTo.type === 'voice' ? '🎤 Voice note' : replyingTo.text}
                </span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReplyingTo(null)}>
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex items-center gap-2">
          {isRecordingVoice ? (
            <VoiceNoteRecorder 
              onSend={handleVoiceSend}
              onCancel={() => setIsRecordingVoice(false)}
            />
          ) : (
            <>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Smile className="h-6 w-6 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon" className="shrink-0" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="h-6 w-6 text-muted-foreground" />
              </Button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileUpload}
              />
              
              <Input 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={editingId ? "Edit message..." : "Type a message"}
                className="flex-1 bg-background border-none focus-visible:ring-1 focus-visible:ring-primary"
              />
              
              {inputText ? (
                <Button size="icon" onClick={handleSend} className="bg-primary hover:bg-primary/90 rounded-full shrink-0">
                  <Send className="h-5 w-5" />
                </Button>
              ) : (
                <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setIsRecordingVoice(true)}>
                  <Mic className="h-6 w-6 text-muted-foreground" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Call Overlay */}
      <Dialog open={!!isCalling} onOpenChange={() => setIsCalling(null)}>
        <DialogContent className="sm:max-w-md bg-secondary/95 backdrop-blur-xl border-none text-center">
          <DialogHeader>
            <DialogTitle className="text-foreground text-xl">
              {isCalling === 'voice' ? 'Voice Call' : 'Video Call'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-8">
            <Avatar className="h-32 w-32 mb-6 border-4 border-background animate-pulse">
              <AvatarFallback className="text-4xl">{chatPartner[0]}</AvatarFallback>
            </Avatar>
            <h3 className="text-2xl font-bold mb-2">{chatPartner}</h3>
            <p className="text-muted-foreground mb-8">Calling...</p>
            
            <div className="flex gap-8">
               <Button 
                size="icon" 
                variant="destructive" 
                className="h-16 w-16 rounded-full"
                onClick={() => setIsCalling(null)}
              >
                <Phone className="h-8 w-8 rotate-[135deg]" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatWindow;
