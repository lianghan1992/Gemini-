import React, { useState, useEffect, useCallback } from 'react';
import { ChatMessage, MessageContentPart } from './types';
import ChatWindow from './components/ChatWindow';
import MessageInput from './components/MessageInput';
import Settings from './components/Settings';
import { SettingsIcon } from './components/icons';
import { fetchChatCompletion, fileToBase64 } from './services/api';

const availableModels = ['gemini-2.5-flash', 'gemini-2.5-pro'];

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState<string>('http://trojan.lianghan.site:60126');
  const [model, setModel] = useState<string>(availableModels[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  useEffect(() => {
    const storedApiKey = localStorage.getItem('gemini_api_key');
    const storedBaseUrl = localStorage.getItem('gemini_base_url');
    let storedModel = localStorage.getItem('gemini_model');

    if (storedApiKey) {
      setApiKey(storedApiKey);
    } else {
      setIsSettingsOpen(true);
    }
    if (storedBaseUrl) {
      setBaseUrl(storedBaseUrl);
    }
    
    if (!storedModel || !availableModels.includes(storedModel)) {
      storedModel = availableModels[0];
      localStorage.setItem('gemini_model', storedModel);
    }
    setModel(storedModel);
  }, []);

  const handleSaveSettings = (newApiKey: string, newBaseUrl: string, newModel: string) => {
    setApiKey(newApiKey);
    setBaseUrl(newBaseUrl);
    setModel(newModel);
    localStorage.setItem('gemini_api_key', newApiKey);
    localStorage.setItem('gemini_base_url', newBaseUrl);
    localStorage.setItem('gemini_model', newModel);
  };

  const handleSendMessage = useCallback(async (text: string, file?: File) => {
    if (!apiKey) {
        setIsSettingsOpen(true);
        const errorMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: '请先在设置中输入您的 API 密钥。',
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, errorMsg]);
        return;
    }

    setIsLoading(true);

    let content: string | MessageContentPart[] = text;
    if (file) {
        try {
            const base64Image = await fileToBase64(file);
            const imagePart: MessageContentPart = { type: 'image_url', image_url: { url: base64Image } };
            if (text) {
                content = [{ type: 'text', text }, imagePart];
            } else {
                content = [imagePart];
            }
        } catch (error) {
            console.error("图片转换失败:", error);
            const errorMsg: ChatMessage = {
                id: Date.now().toString(),
                role: 'assistant',
                content: '图片处理失败，请重试。',
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, errorMsg]);
            setIsLoading(false);
            return;
        }
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    try {
      const assistantResponse = await fetchChatCompletion(newMessages, apiKey, baseUrl, model);
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantResponse,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("API 调用失败:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error instanceof Error ? `出现错误: ${error.message}` : '发生未知错误',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, baseUrl, messages, model]);

  return (
    <div className="h-screen w-screen flex flex-col font-sans text-base text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-900">
        <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
            <h1 className="text-xl font-semibold">Gemini 聊天</h1>
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="打开设置"
            >
                <SettingsIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </button>
        </header>

      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatWindow messages={messages} isLoading={isLoading} />
        <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>

      <Settings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
        initialApiKey={apiKey}
        initialBaseUrl={baseUrl}
        initialModel={model}
      />
    </div>
  );
};

export default App;