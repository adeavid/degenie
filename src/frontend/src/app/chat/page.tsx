'use client';

import { useState, useEffect, useRef } from 'react';

// Force this page to be client-side only
export const dynamic = 'force-dynamic';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Smile,
  Paperclip,
  Hash,
  Users,
  Circle,
  Crown,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { formatAddress, getTimeAgo } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  user: {
    address: string;
    username?: string;
    tier: 'free' | 'starter' | 'viral';
    avatar?: string;
    isCreator?: boolean;
    tokensCreated?: number;
  };
  message: string;
  timestamp: number;
  type: 'message' | 'token_creation' | 'graduation' | 'trade' | 'system';
  tokenSymbol?: string;
  amount?: number;
  reactions?: {
    emoji: string;
    count: number;
    users: string[];
  }[];
}

interface ChatRoom {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  isActive?: boolean;
  category: 'general' | 'trading' | 'creators' | 'graduated';
}

// Mock data
const chatRooms: ChatRoom[] = [
  {
    id: 'general',
    name: 'General',
    description: 'General discussion',
    memberCount: 1247,
    isActive: true,
    category: 'general'
  },
  {
    id: 'trading',
    name: 'Trading',
    description: 'Trading signals & analysis',
    memberCount: 856,
    category: 'trading'
  },
  {
    id: 'creators',
    name: 'Creators',
    description: 'Token creator discussions',
    memberCount: 324,
    category: 'creators'
  },
  {
    id: 'graduated',
    name: 'Graduated Tokens',
    description: 'Successful graduation stories',
    memberCount: 189,
    category: 'graduated'
  }
];

const mockMessages: ChatMessage[] = [
  {
    id: '1',
    user: {
      address: 'So11111111111111111111111111111111111111112',
      username: 'CryptoWhale',
      tier: 'viral',
      isCreator: true,
      tokensCreated: 12
    },
    message: 'Just launched $PEPEAI and it\'s already pumping! 🚀',
    timestamp: Date.now() - 300000,
    type: 'message',
    reactions: [
      { emoji: '🚀', count: 5, users: [] },
      { emoji: '💎', count: 3, users: [] }
    ]
  },
  {
    id: '2',
    user: {
      address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      username: 'TokenMaster',
      tier: 'starter',
      isCreator: false
    },
    message: 'Anyone else seeing this massive volume on $MOONCAT?',
    timestamp: Date.now() - 600000,
    type: 'message'
  },
  {
    id: '3',
    user: {
      address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
      tier: 'free'
    },
    message: '$DGENIE just graduated! 🎓 Congratulations to all holders!',
    timestamp: Date.now() - 900000,
    type: 'graduation',
    tokenSymbol: 'DGENIE'
  },
  {
    id: '4',
    user: {
      address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
      username: 'ApeInvester',
      tier: 'starter'
    },
    message: 'LFG! Just bought 100k $PAI tokens 💎🙌',
    timestamp: Date.now() - 1200000,
    type: 'trade',
    tokenSymbol: 'PAI',
    amount: 100000
  }
];

const onlineUsers = [
  { address: 'So11111111111111111111111111111111111111112', username: 'CryptoWhale', tier: 'viral' },
  { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', username: 'TokenMaster', tier: 'starter' },
  { address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', tier: 'free' },
  { address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', username: 'ApeInvester', tier: 'starter' }
];

export default function ChatPage() {
  const { connected, address: publicKey } = useWalletConnection();
  const router = useRouter();
  const [selectedRoom, setSelectedRoom] = useState('general');
  const [messages, setMessages] = useState(mockMessages);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!connected) {
      router.push('/');
    }
  }, [connected, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim() || !publicKey) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      user: {
        address: publicKey.toString(),
        tier: 'starter' // In real app, get from user data
      },
      message: newMessage,
      timestamp: Date.now(),
      type: 'message'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'viral': return <Crown className="w-4 h-4 text-purple-400" />;
      case 'starter': return <Zap className="w-4 h-4 text-blue-400" />;
      default: return null;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'viral': return 'border-purple-500';
      case 'starter': return 'border-blue-500';
      default: return 'border-gray-600';
    }
  };

  const addReaction = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const existingReaction = msg.reactions?.find(r => r.emoji === emoji);
        if (existingReaction) {
          return {
            ...msg,
            reactions: msg.reactions?.map(r => 
              r.emoji === emoji 
                ? { ...r, count: r.count + 1 }
                : r
            )
          };
        } else {
          return {
            ...msg,
            reactions: [...(msg.reactions || []), { emoji, count: 1, users: [] }]
          };
        }
      }
      return msg;
    }));
  };

  if (!connected) {
    return null;
  }

  const currentRoom = chatRooms.find(room => room.id === selectedRoom);

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Community Chat</h1>
          <p className="text-gray-400">Connect with the DeGenie community</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-12rem)]">
          {/* Sidebar - Rooms & Users */}
          <div className="lg:col-span-1 space-y-6">
            {/* Chat Rooms */}
            <Card className="bg-gray-800/50 border-gray-700">
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Hash className="w-5 h-5 mr-2" />
                  Channels
                </h3>
                <div className="space-y-2">
                  {chatRooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoom(room.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg transition-colors",
                        selectedRoom === room.id
                          ? "bg-purple-600 text-white"
                          : "hover:bg-gray-700 text-gray-300"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium"># {room.name}</span>
                        <span className="text-xs text-gray-400">{room.memberCount}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{room.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Online Users */}
            <Card className="bg-gray-800/50 border-gray-700">
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Online ({onlineUsers.length})
                </h3>
                <div className="space-y-2">
                  {onlineUsers.map((user) => (
                    <div key={user.address} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700/50">
                      <div className={cn(
                        "w-8 h-8 rounded-full border-2 flex items-center justify-center relative",
                        getTierColor(user.tier)
                      )}>
                        <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1">
                          <span className="text-white text-sm font-medium truncate">
                            {user.username || formatAddress(user.address)}
                          </span>
                          {getTierIcon(user.tier)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <Card className="bg-gray-800/50 border-gray-700 h-full flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Hash className="w-6 h-6 text-purple-400" />
                    <div>
                      <h2 className="text-xl font-bold text-white">{currentRoom?.name}</h2>
                      <p className="text-gray-400 text-sm">{currentRoom?.description} • {currentRoom?.memberCount} members</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Circle className="w-4 h-4 text-green-400 fill-current" />
                    <span className="text-green-400 text-sm">{onlineUsers.length} online</span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group"
                    >
                      <div className="flex items-start space-x-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                          getTierColor(message.user.tier)
                        )}>
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {(message.user.username || message.user.address).charAt(0).toUpperCase()}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-white">
                              {message.user.username || formatAddress(message.user.address)}
                            </span>
                            {getTierIcon(message.user.tier)}
                            {message.user.isCreator && (
                              <div className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-xs font-medium">
                                Creator
                              </div>
                            )}
                            {message.type === 'graduation' && (
                              <div className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs font-medium">
                                🎓 Graduation
                              </div>
                            )}
                            <span className="text-gray-500 text-xs">{getTimeAgo(message.timestamp)}</span>
                          </div>
                          
                          <div className="text-gray-200 break-words">
                            {message.message}
                          </div>

                          {/* Reactions */}
                          {message.reactions && message.reactions.length > 0 && (
                            <div className="flex items-center space-x-2 mt-2">
                              {message.reactions.map((reaction, index) => (
                                <button
                                  key={index}
                                  onClick={() => addReaction(message.id, reaction.emoji)}
                                  className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded-full text-xs flex items-center space-x-1 transition-colors"
                                >
                                  <span>{reaction.emoji}</span>
                                  <span className="text-gray-300">{reaction.count}</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Quick Reactions */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                            <div className="flex items-center space-x-1">
                              {['🚀', '💎', '👍', '❤️', '😂'].map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => addReaction(message.id, emoji)}
                                  className="hover:bg-gray-700 p-1 rounded text-sm transition-colors"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={`Message #${currentRoom?.name}...`}
                      className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <div className="flex items-center space-x-4">
                    <button className="hover:text-gray-300 transition-colors">
                      <Smile className="w-4 h-4" />
                    </button>
                    <button className="hover:text-gray-300 transition-colors">
                      <Paperclip className="w-4 h-4" />
                    </button>
                  </div>
                  <span>Press Enter to send, Shift+Enter for new line</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}