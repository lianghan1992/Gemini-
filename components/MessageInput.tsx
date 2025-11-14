import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, AttachmentIcon, CloseIcon } from './icons';

interface MessageInputProps {
  onSendMessage: (text: string, file?: File) => void;
  isLoading: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [text]);

  // Cleanup for image preview URL to prevent memory leaks
  useEffect(() => {
    return () => {
        if (imagePreviewUrl) {
            URL.revokeObjectURL(imagePreviewUrl);
        }
    };
  }, [imagePreviewUrl]);

  const removeFile = () => {
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
        setImagePreviewUrl(null);
      }
  };

  const handleSend = () => {
    if ((text.trim() || file) && !isLoading) {
      onSendMessage(text.trim(), file || undefined);
      setText('');
      removeFile();
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    removeFile(); // Clear previous file first
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setImagePreviewUrl(URL.createObjectURL(selectedFile));
    }
  };
  
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const pastedFile = items[i].getAsFile();
        if (pastedFile) {
          removeFile(); // Clear previous file
          setFile(pastedFile);
          setImagePreviewUrl(URL.createObjectURL(pastedFile));
          e.preventDefault();
          return;
        }
      }
    }
  };

  const canSend = !isLoading && (text.trim() !== '' || !!file);

  return (
    <div className="px-4 pb-4 pt-2 shrink-0">
      <div className="w-full max-w-4xl mx-auto flex flex-col">
        {imagePreviewUrl && (
            <div className="mb-3 p-2 bg-user-bg dark:bg-dark-user-bg rounded-lg w-fit-content self-start relative">
                <img src={imagePreviewUrl} alt="图片预览" className="max-h-24 max-w-full rounded-md" />
                <button 
                  onClick={removeFile} 
                  className="absolute -top-2 -right-2 bg-gray-600 hover:bg-red-500 text-white rounded-full p-1 transition-colors"
                  aria-label="移除图片"
                >
                    <CloseIcon className="w-3 h-3"/>
                </button>
            </div>
        )}
        <div 
          onPaste={handlePaste}
          className="flex items-end bg-input-bg dark:bg-dark-input-bg rounded-2xl p-2.5 border border-border dark:border-dark-border focus-within:ring-2 focus-within:ring-accent-start/50 dark:focus-within:ring-dark-accent-start/50 focus-within:border-accent-start dark:focus-within:border-dark-accent-start transition-all duration-300 shadow-input dark:shadow-input-dark"
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary transition-colors"
                aria-label="附加文件"
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
                placeholder="输入消息，或粘贴图片..."
                rows={1}
                className="flex-1 bg-transparent border-none focus:ring-0 resize-none text-text-primary dark:text-dark-text-primary placeholder-text-secondary dark:placeholder-dark-text-secondary max-h-[320px] overflow-y-auto"
            />
            <button
                onClick={handleSend}
                disabled={!canSend}
                className={`p-2 rounded-full transition-all duration-300 ${
                  canSend
                    ? 'bg-gemini-gradient dark:bg-dark-gemini-gradient text-white shadow-md hover:shadow-lg'
                    : 'bg-user-bg dark:bg-dark-user-bg text-text-secondary dark:text-dark-text-secondary cursor-not-allowed'
                }`}
                aria-label="发送消息"
            >
                <SendIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
