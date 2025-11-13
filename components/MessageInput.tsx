import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, AttachmentIcon, TrashIcon } from './icons';

interface MessageInputProps {
  onSendMessage: (text: string, file?: File) => void;
  isLoading: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  const handleSend = () => {
    if ((text.trim() || file) && !isLoading) {
      onSendMessage(text.trim(), file || undefined);
      setText('');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
  };


  return (
    <div className="px-4 pb-4 pt-2">
      <div className="w-full max-w-4xl mx-auto">
        {file && (
            <div className="mb-2 p-2 bg-gemini-user-bg rounded-md">
                <div className="flex items-center justify-between text-sm text-gemini-text-secondary">
                    <span className="truncate">已选择文件: {file.name}</span>
                    <button onClick={removeFile} className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0">
                        <TrashIcon className="w-4 h-4"/>
                    </button>
                </div>
            </div>
        )}
        <div className="flex items-end bg-gemini-input-bg rounded-2xl p-2 border border-gemini-border focus-within:border-gemini-accent-start transition-colors">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gemini-text-secondary hover:text-gemini-text"
            >
                <AttachmentIcon className="w-6 h-6" />
            </button>
            <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
                placeholder="输入消息..."
                rows={1}
                className="flex-1 bg-transparent border-none focus:ring-0 resize-none text-gemini-text placeholder-gemini-text-secondary max-h-48 overflow-y-auto"
            />
            <button
                onClick={handleSend}
                disabled={isLoading || (!text.trim() && !file)}
                className="p-2 rounded-full bg-gemini-user-bg text-gemini-text disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-gemini-border transition-colors"
            >
                <SendIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;