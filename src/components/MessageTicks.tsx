import React from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageTicksProps {
  status: 'sent' | 'delivered' | 'seen';
}

const MessageTicks: React.FC<MessageTicksProps> = ({ status }) => {
  if (status === 'sent') {
    return <Check className="h-3.5 w-3.5 text-muted-foreground/70" />;
  }
  
  if (status === 'delivered') {
    return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground/70" />;
  }
  
  // seen
  return <CheckCheck className="h-3.5 w-3.5 text-blue-400" />;
};

export default MessageTicks;
