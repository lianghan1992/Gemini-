
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
      {messages.map((msg) => (
        <Message key={msg.id} message={msg} />
      ))}
      {isLoading && (
         <div className="flex items-start gap-4 p-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                <BotIcon className="w-5 h-5 text-white" />
            </div>
            <div className="max-w-xl p-4 rounded-lg shadow-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
