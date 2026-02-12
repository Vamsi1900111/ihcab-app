import React, { useState, useRef } from 'react';
import { Mic, Square, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface VoiceNoteRecorderProps {
  onSend: (audioUrl: string, duration: number) => void;
  onCancel: () => void;
}

const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(true);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef(Date.now());

  React.useEffect(() => {
    startRecording();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch {
      onCancel();
    }
  };

  const stopAndSend = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === 'recording') {
      recorder.onstop = () => {
        recorder.stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const finalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        onSend(url, finalDuration);
      };
      recorder.stop();
    }
  };

  const cancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === 'recording') {
      recorder.onstop = () => {
        recorder.stream.getTracks().forEach(t => t.stop());
      };
      recorder.stop();
    }
    onCancel();
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-3 w-full"
    >
      <Button variant="ghost" size="icon" className="shrink-0 text-destructive" onClick={cancel}>
        <Square className="h-5 w-5" />
      </Button>
      
      <div className="flex-1 flex items-center gap-2 bg-background rounded-full px-4 py-2">
        <motion.div 
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-3 h-3 rounded-full bg-destructive"
        />
        <span className="text-sm font-mono text-foreground">{formatTime(duration)}</span>
        <div className="flex-1 flex items-center gap-0.5">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{ height: isRecording ? [4, 8 + Math.random() * 12, 4] : 4 }}
              transition={{ repeat: Infinity, duration: 0.5 + Math.random() * 0.5, delay: i * 0.05 }}
              className="w-1 bg-primary rounded-full"
              style={{ minHeight: 4 }}
            />
          ))}
        </div>
      </div>

      <Button size="icon" onClick={stopAndSend} className="bg-primary hover:bg-primary/90 rounded-full shrink-0">
        <Send className="h-5 w-5" />
      </Button>
    </motion.div>
  );
};

export default VoiceNoteRecorder;
