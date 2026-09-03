import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, MessageSquare, ShieldCheck, ShoppingBag } from 'lucide-react';
import { Conversation, Message } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';
import { io, Socket } from 'socket.io-client';

export const Messages: React.FC = () => {
  const { user, openAuthModal } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetConvId = searchParams.get('conversationId');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(targetConvId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) return;

    // Connect socket
    const socket = io('/', { path: '/socket.io' });
    socketRef.current = socket;
    socket.emit('join:user', user.id);

    socket.on('message:received', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const fetchConversations = () => {
    if (!user) return;
    api.getConversations()
      .then((res) => {
        setConversations(res.conversations);
        if (!activeConvId && res.conversations.length > 0) {
          setActiveConvId(res.conversations[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  useEffect(() => {
    if (activeConvId) {
      api.getMessages(activeConvId)
        .then((res) => setMessages(res.messages))
        .catch(console.error);
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConvId) return;

    const content = inputText.trim();
    setInputText('');

    try {
      const res = await api.sendMessage(activeConvId, content);
      setMessages(prev => [...prev, res.message]);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Campus Messages</h2>
        <p className="text-xs text-gray-500">Log in to view your marketplace conversations.</p>
        <button onClick={openAuthModal} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold">
          Campus Login
        </button>
      </div>
    );
  }

  const activeConv = conversations.find(c => c.id === activeConvId);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-3 h-[75vh]">
      
      {/* Sidebar - Conversations */}
      <div className="border-r border-gray-200 flex flex-col h-full bg-gray-50/50">
        <div className="p-4 border-b border-gray-200 font-bold text-gray-900 text-base flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" /> Messages
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {loading ? (
            <div className="p-4 text-xs text-gray-400">Loading chats...</div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-500">No active conversations yet.</div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={`w-full p-3.5 text-left flex items-start gap-3 transition ${
                  activeConvId === conv.id ? 'bg-blue-50/80 border-l-4 border-blue-600' : 'hover:bg-gray-100/60'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  {conv.partner.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900 text-xs truncate">{conv.partner.name}</span>
                    {conv.unreadCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>

                  {conv.listing && (
                    <span className="text-[11px] text-blue-600 font-medium truncate block">
                      Re: {conv.listing.title}
                    </span>
                  )}

                  <p className="text-[11px] text-gray-500 truncate mt-0.5">
                    {conv.lastMessage?.content || 'No messages yet'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Thread Area */}
      <div className="md:col-span-2 flex flex-col h-full bg-white">
        {activeConv ? (
          <>
            {/* Thread Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                  {activeConv.partner.name.charAt(0)}
                </div>
                <div>
                  <span className="font-bold text-gray-900 text-sm block">{activeConv.partner.name}</span>
                  {activeConv.partner.isVerified && <Badge type="VERIFIED" />}
                </div>
              </div>

              {activeConv.listing && (
                <div className="text-right text-xs bg-gray-50 p-2 rounded-lg border border-gray-200">
                  <span className="text-gray-500 block text-[10px]">Listing Context:</span>
                  <span className="font-semibold text-gray-800">{activeConv.listing.title}</span>
                </div>
              )}
            </div>

            {/* Messages timeline */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50/30">
              {messages.map((msg) => {
                const isMe = msg.senderId === user.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] p-3 rounded-2xl text-xs space-y-1 ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                      }`}
                    >
                      <p className="leading-relaxed">{msg.content}</p>
                      <span className={`text-[10px] block text-right ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Send input */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 bg-white flex items-center gap-2">
              <input
                type="text"
                placeholder="Write a message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 px-4 py-2 text-xs bg-gray-100 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400 text-xs">
            <MessageSquare className="w-12 h-12 text-gray-300 mb-2" />
            Select a conversation to begin chat.
          </div>
        )}
      </div>
    </div>
  );
};
