
import React from 'react';
import { ChatMessage, MessageContentPart } from '../types';
import { UserIcon, BotIcon } from './icons';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';


const Message: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.role === 'user';

  const renderContent = (content: string | MessageContentPart[]) => {
    if (typeof content === 'string') {
      return <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{content}</ReactMarkdown>;
    }
    return content.map((part, index) => {
      if (part.type === 'text' && part.text) {
        return <p key={index} className="whitespace-pre-wrap">{part.text}</p>;
      }
      if (part.type === 'image_url' && part.image_url) {
        return <img key={index} src={part.image_url.url} alt="上传的图片" className="mt-2 rounded-lg max-w-xs" />;
      }
      return null;
    });
  };

  return (
    <div className={`flex items-start gap-4 p-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-indigo-500' : 'bg-gray-600'}`}>
        {isUser ? <UserIcon className="w-5 h-5 text-white" /> : <BotIcon className="w-5 h-5 text-white" />}
      </div>
      <div className={`max-w-xl p-4 rounded-lg shadow-md prose dark:prose-invert prose-p:my-0 prose-pre:my-2 prose-blockquote:my-2 ${isUser ? 'bg-indigo-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
        {renderContent(message.content)}
      </div>
    </div>
  );
};

export default Message;