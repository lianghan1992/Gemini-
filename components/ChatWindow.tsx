import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import Message from './Message';
import { GeminiSparkIcon } from './icons';
import SuggestionCard from './SuggestionCard';

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSuggestionClick: (suggestion: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, onSuggestionClick }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);
  
  const InitialScreen = () => (
    <div className="flex flex-col items-center justify-center h-full text-gemini-text">
        <h1 className="text-5xl font-bold mb-8 bg-gemini-gradient bg-clip-text text-transparent">
            你好，我是 Gemini
        </h1>
        <h2 className="text-2xl text-gemini-text-secondary mb-12">我能为您做些什么？</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full px-4">
            <SuggestionCard 
                title="写一首诗"
                description="关于星空和梦想"
                onClick={() => onSuggestionClick('写一首关于星空和梦想的诗')}
            />
            <SuggestionCard 
                title="计划一次旅行"
                description="去日本的七日行程"
                onClick={() => onSuggestionClick('帮我计划一次去日本的七日旅行')}
            />
            <SuggestionCard 
                title="解释一个概念"
                description="用简单的语言解释什么是量子计算"
                onClick={() => onSuggestionClick('用简单的语言解释什么是量子计算')}
            />
            <SuggestionCard 
                title="帮我调试代码"
                description="找出这段Python代码中的错误"
                onClick={() => onSuggestionClick('帮我调试以下这段Python代码中的错误：\n```python\ndef buggy_function(items):\n  for i in range(len(items)):\n    print(items[i+1])\n\nbuggy_function([1, 2, 3])\n```')}
            />
        </div>
    </div>
  );

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4">
            {messages.length === 0 && !isLoading && <InitialScreen />}
            {messages.map((msg, index) => {
                const isStreaming = isLoading && msg.role === 'assistant' && index === messages.length - 1;
                return <Message key={msg.id} message={msg} isStreaming={isStreaming} />
            })}
        </div>
    </div>
  );
};

export default ChatWindow;