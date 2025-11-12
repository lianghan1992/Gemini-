
import React, { useState, useRef } from 'react';
import { SendIcon, AttachmentIcon, TrashIcon } from './icons';

interface MessageInputProps {
  onSendMessage: (text: string, file?: File) => void;
  isLoading: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if ((text.trim() || file) && !isLoading) {
      onSendMessage(text.trim(), file || undefined);
      setText('');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
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
    <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="relative">
        {file && (
            <div className="absolute bottom-full left-0 right-0 p-2 bg-gray-100 dark:bg-gray-700 rounded-t-md">
                <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
                    <span>已选择文件: {file.name}</span>
                    <button onClick={removeFile} className="text-red-500 hover:text-red-700">
                        <TrashIcon className="w-4 h-4"/>
                    </button>
                </div>
            </div>
        )}
        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-2">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
                <AttachmentIcon className="w-6 h-6" />
            </button>
            <textarea
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
                className="flex-1 bg-transparent border-none focus:ring-0 resize-none text-gray-800 dark:text-gray-200 placeholder-gray-500"
            />
            <button
                onClick={handleSend}
                disabled={isLoading || (!text.trim() && !file)}
                className="p-2 rounded-full bg-indigo-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
            >
                <SendIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
