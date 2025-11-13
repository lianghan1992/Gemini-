
import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import Message from './Message';
import { BotIcon } from './icons';

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);
  
  const InitialScreen = () => (
    <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <BotIcon className="w-24 h-24 mb-4 text-gray-400" />
        <h1 className="text-2xl font-semibold">Gemini 聊天</h1>
        <p className="mt-2">我能为您做些什么？</p>
    </div>
  );

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
      {messages.length === 0 && !isLoading && <InitialScreen />}
      {messages.map((msg, index) => {
        const isStreaming = isLoading && msg.role === 'assistant' && index === messages.length - 1;
        return <Message key={msg.id} message={msg} isStreaming={isStreaming} />
      })}
    </div>
  );
};

export default ChatWindow;