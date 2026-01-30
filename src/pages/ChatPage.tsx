import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useSocket } from '@/contexts/SocketContext';
import { storage } from '@/lib/storage';
import {
  ArrowLeft,
  Send,
  MapPin,
  Clock,
  Phone,
  MoreVertical,
  Smile,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  message: string;
  messageType: 'text' | 'location' | 'quick_message' | 'system';
  isRead: boolean;
  createdAt: string;
}

export default function ChatPage() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { socket, isConnected, emit, on, off } = useSocket();
  const currentUser = storage.get('current_user');

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<any>(null);
  const [conversationId, setConversationId] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickMessages = [
    "I'm on my way! 🚗",
    "Arriving in 5 minutes ⏰",
    "I've arrived 📍",
    "Running a bit late 🕐",
    "Thank you! 👍",
  ];

  useEffect(() => {
    // Load ride details and setup conversation
    const rides = storage.get('rides') || [];
    const ride = rides.find((r: any) => r.id === rideId);
    
    if (ride) {
      // Determine other user (driver or passenger)
      const isDriver = ride.driverId === currentUser?.id;
      const otherUserId = isDriver ? 'passenger-id' : ride.driverId;
      
      // Get other user details
      const users = storage.get('users') || [];
      const other = users.find((u: any) => u.id === otherUserId);
      setOtherUser(other);

      // Create conversation ID
      const convId = `conv-${rideId}`;
      setConversationId(convId);

      // Join conversation
      if (socket && isConnected) {
        emit('join_conversation', convId);
      }

      // Load existing messages (mock data for now)
      const mockMessages: Message[] = [
        {
          id: '1',
          senderId: otherUserId,
          recipientId: currentUser?.id || '',
          message: 'Hi! Looking forward to the ride.',
          messageType: 'text',
          isRead: true,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ];
      setMessages(mockMessages);
    }

    // Socket event listeners
    const handleNewMessage = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      scrollToBottom();
      
      // Mark as read
      if (msg.senderId !== currentUser?.id) {
        emit('mark_read', { conversationId: convId });
      }
    };

    const handleUserTyping = (data: any) => {
      if (data.userId !== currentUser?.id) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    };

    const handleLocationShared = (data: any) => {
      toast({
        title: '📍 Location Shared',
        description: 'The other user shared their location',
      });
    };

    if (socket) {
      on('new_message', handleNewMessage);
      on('user_typing', handleUserTyping);
      on('location_shared', handleLocationShared);
    }

    return () => {
      if (socket) {
        off('new_message', handleNewMessage);
        off('user_typing', handleUserTyping);
        off('location_shared', handleLocationShared);
      }
    };
  }, [rideId, socket, isConnected]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !otherUser) return;

    emit('send_message', {
      conversationId,
      recipientId: otherUser.id,
      message: newMessage,
      messageType: 'text',
    });

    // Optimistically add message
    const tempMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUser?.id || '',
      recipientId: otherUser.id,
      message: newMessage,
      messageType: 'text',
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage('');
    scrollToBottom();
  };

  const handleQuickMessage = (msg: string) => {
    emit('send_message', {
      conversationId,
      recipientId: otherUser?.id,
      message: msg,
      messageType: 'quick_message',
    });

    const tempMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUser?.id || '',
      recipientId: otherUser?.id || '',
      message: msg,
      messageType: 'quick_message',
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);
  };

  const handleShareLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        emit('share_location', {
          conversationId,
          recipientId: otherUser?.id,
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        });
        
        toast({
          title: '📍 Location Shared',
          description: 'Your location has been shared',
        });
      },
      (error) => {
        toast({
          title: 'Location Error',
          description: 'Unable to get your location',
          variant: 'destructive',
        });
      }
    );
  };

  const handleTyping = () => {
    emit('typing_start', {
      conversationId,
      recipientId: otherUser?.id,
    });

    setTimeout(() => {
      emit('typing_stop', {
        conversationId,
        recipientId: otherUser?.id,
      });
    }, 2000);
  };

  if (!otherUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <Card className="rounded-none border-x-0 border-t-0 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Avatar>
              <AvatarImage src={otherUser.photo} />
              <AvatarFallback>{otherUser.name?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{otherUser.name}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {isConnected ? (
                  <>
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Online</span>
                  </>
                ) : (
                  <span>Offline</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Phone className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUser?.id;
          return (
            <div
              key={msg.id}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  isMine
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm">{msg.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs opacity-70">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {isMine && (
                    <span className="text-xs">
                      {msg.isRead ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg p-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce delay-100" />
                <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Messages */}
      <div className="px-4 py-2 overflow-x-auto">
        <div className="flex gap-2">
          {quickMessages.map((msg, idx) => (
            <Badge
              key={idx}
              variant="outline"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground whitespace-nowrap"
              onClick={() => handleQuickMessage(msg)}
            >
              {msg}
            </Badge>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <Card className="rounded-none border-x-0 border-b-0 p-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShareLocation}
          >
            <MapPin className="w-5 h-5" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="icon"
          >
            <Smile className="w-5 h-5" />
          </Button>
          <Button
            size="icon"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
