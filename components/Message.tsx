import React from 'react';
import { ChatMessage, MessageContentPart } from '../types';
import { UserIcon, GeminiSparkIcon } from './icons';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import CodeBlock from './CodeBlock';

const BlinkingCursor: React.FC = () => (
    <span className="inline-block w-2 h-5 bg-gemini-text-secondary animate-pulse ml-1 rounded-sm" />
);

const Message: React.FC<{ message: ChatMessage; isStreaming?: boolean }> = ({ message, isStreaming }) => {
  const isUser = message.role === 'user';

  const renderContent = (content: string | MessageContentPart[]) => {
    if (typeof content === 'string') {
        return (
            <div className="prose prose-p:my-2 prose-pre:my-2 prose-blockquote:my-2 max-w-none">
                <ReactMarkdown 
                    remarkPlugins={[remarkMath, remarkGfm]} 
                    rehypePlugins={[rehypeKatex]}
                    components={{
                        code(props) {
                            const {children, className, ...rest} = props
                            const match = /language-(\w+)/.exec(className || '')
                            return match ? (
                                <CodeBlock language={match[1]} value={String(children).replace(/\n$/, '')} />
                            ) : (
                                <code {...rest} className={className}>
                                    {children}
                                </code>
                            )
                        }
                    }}
                >
                    {content}
                </ReactMarkdown>
                {isStreaming && <BlinkingCursor />}
            </div>
        );
    }
    return (
      <div className="flex flex-col gap-2">
        {content.map((part, index) => {
          if (part.type === 'text' && part.text) {
            return <p key={index} className="whitespace-pre-wrap">{part.text}</p>;
          }
          if (part.type === 'image_url' && part.image_url) {
            return <img key={index} src={part.image_url.url} alt="上传的图片" className="mt-2 rounded-lg max-w-xs" />;
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <div className={`flex items-start gap-4 p-4 `}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gemini-user-bg`}>
        {isUser ? <UserIcon className="w-5 h-5 text-gemini-text" /> : <GeminiSparkIcon className="w-6 h-6" />}
      </div>
      <div className={`max-w-full md:max-w-3xl flex-1`}>
        <p className="font-semibold text-gemini-text mb-2">{isUser ? 'You' : 'Gemini'}</p>
        <div className="text-gemini-text">
            {renderContent(message.content)}
        </div>
      </div>
    </div>
  );
};

export default Message;