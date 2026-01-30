import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  ArrowLeft,
  Send,
  Phone,
  MoreVertical,
  Image as ImageIcon,
  Paperclip,
} from 'lucide-react';
import { storage, User as UserType } from '@/lib/storage';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isQuickReply?: boolean;
}

const Chat = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<UserType | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickReplies = [
    "I'm on my way!",
    "Running 5 min late",
    "I've arrived",
    "Where are you?",
  ];

  useEffect(() => {
    if (!user || !userId) {
      navigate('/');
      return;
    }

    // Load other user
    const allUsers = storage.get<{ [key: string]: UserType }>('users:all') || {};
    const foundUser = Object.values(allUsers).find((u) => u.id === userId);
    setOtherUser(foundUser || null);

    // Load or create demo messages
    const chatKey = `chat:${[user.id, userId].sort().join('-')}`;
    let chatMessages = storage.get<Message[]>(chatKey) || [];

    if (chatMessages.length === 0) {
      // Create demo messages
      chatMessages = [
        {
          id: 'msg-1',
          senderId: userId,
          senderName: foundUser?.name || 'Driver',
          text: "Hi! I'll be picking you up in 15 minutes.",
          timestamp: new Date(Date.now() - 600000).toISOString(),
        },
        {
          id: 'msg-2',
          senderId: user.id,
          senderName: user.name,
          text: 'Great! See you soon.',
          timestamp: new Date(Date.now() - 300000).toISOString(),
        },
      ];
      storage.set(chatKey, chatMessages);
    }

    setMessages(chatMessages);
  }, [user, userId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (text?: string) => {
    if (!user || !userId) return;

    const messageText = text || newMessage.trim();
    if (!messageText) return;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      senderId: user.id,
      senderName: user.name,
      text: messageText,
      timestamp: new Date().toISOString(),
    };

    const chatKey = `chat:${[user.id, userId].sort().join('-')}`;
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    storage.set(chatKey, updatedMessages);
    setNewMessage('');
  };

  const handleQuickReply = (reply: string) => {
    handleSendMessage(reply);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (!user || !otherUser) return null;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="gradient-primary text-white p-4 shadow-lg">
        <div className="container max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-white hover:bg-white/10 -ml-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="font-semibold">{otherUser.name.charAt(0)}</span>
            </div>
            <div>
              <h2 className="font-semibold">{otherUser.name}</h2>
              <p className="text-xs text-white/70">Online</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
            >
              <Phone className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
            >
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
        <div className="container max-w-2xl mx-auto">
          {messages.map((message) => {
            const isOwn = message.senderId === user.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    isOwn
                      ? 'bg-primary text-white rounded-br-sm'
                      : 'bg-white text-card-foreground rounded-bl-sm shadow-sm'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwn ? 'text-white/70' : 'text-muted-foreground'
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Replies */}
      <div className="border-t bg-background p-3">
        <div className="container max-w-2xl mx-auto">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {quickReplies.map((reply) => (
              <Button
                key={reply}
                variant="outline"
                size="sm"
                onClick={() => handleQuickReply(reply)}
                className="whitespace-nowrap text-xs"
              >
                {reply}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t bg-background p-4 shadow-lg">
        <div className="container max-w-2xl mx-auto">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="flex-shrink-0">
              <Paperclip className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="flex-shrink-0">
              <ImageIcon className="w-5 h-5" />
            </Button>
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={!newMessage.trim()}
              className="gradient-primary flex-shrink-0"
              size="icon"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
