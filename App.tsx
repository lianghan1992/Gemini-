import React, { useState, useEffect, useCallback } from 'react';
import { ChatMessage, MessageContentPart } from './types';
import ChatWindow from './components/ChatWindow';
import MessageInput from './components/MessageInput';
import Settings from './components/Settings';
import { SettingsIcon } from './components/icons';
import { fetchChatCompletionStream, fileToBase64, fetchModels } from './services/api';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [model, setModel] = useState<string>('gemini-2.5-flash');
  const [availableModels, setAvailableModels] = useState<string[]>(['gemini-2.5-flash', 'gemini-2.5-pro']);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  
  // 使用相对路径，请求将发送到同一域名下的 /api 路径，由 Apache 反向代理处理
  const baseUrl = '/api';

  const updateModels = useCallback(async (key: string) => {
    // API 请求现在会变成 /api/v1/models
    const models = await fetchModels(key, baseUrl);
    if (models.length > 0) {
      setAvailableModels(models);
      const storedModel = localStorage.getItem('gemini_model');
      if (storedModel && models.includes(storedModel)) {
        setModel(storedModel);
      } else {
        setModel(models[0]);
        localStorage.setItem('gemini_model', models[0]);
      }
    }
  }, []);

  useEffect(() => {
    const storedApiKey = localStorage.getItem('gemini_api_key');
    const storedModel = localStorage.getItem('gemini_model');

    if (storedApiKey) {
      setApiKey(storedApiKey);
      updateModels(storedApiKey);
    } else {
      setIsSettingsOpen(true);
    }
    
    if (storedModel) {
        setModel(storedModel)
    }
  }, [updateModels]);

  const handleSaveSettings = (newApiKey: string, newModel: string) => {
    setApiKey(newApiKey);
    setModel(newModel);
    localStorage.setItem('gemini_api_key', newApiKey);
    localStorage.setItem('gemini_model', newModel);
    updateModels(newApiKey);
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
    setIsLoading(true);

    const assistantId = (Date.now() + 1).toString();
    const assistantMessage: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
    };
    setMessages(prev => [...prev, assistantMessage]);

    await fetchChatCompletionStream(
      newMessages, 
      apiKey, 
      baseUrl, 
      model,
      (chunk) => {
        setMessages(prev => prev.map(msg => 
            msg.id === assistantId 
                ? { ...msg, content: msg.content + chunk }
                // @ts-ignore
                : msg
        ));
      },
      () => {
        setIsLoading(false);
      },
      (error) => {
        setMessages(prev => prev.map(msg => 
            msg.id === assistantId 
                ? { ...msg, content: `出现错误: ${error.message}` }
                // @ts-ignore
                : msg
        ));
        setIsLoading(false);
      }
    );

  }, [apiKey, messages, model]);

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
        initialModel={model}
        availableModels={availableModels}
      />
    </div>
  );
};

export default App;