import React, { useState, useEffect, useCallback } from 'react';
import { ChatMessage, MessageContentPart } from './types';
import ChatWindow from './components/ChatWindow';
import MessageInput from './components/MessageInput';
import Settings from './components/Settings';
import { SettingsIcon, RefreshIcon } from './components/icons';
import { fetchChatCompletionStream, fileToBase64, fetchModels } from './services/api';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [model, setModel] = useState<string>('gemini-2.5-flash');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  
  const baseUrl = '/api';

  const updateModels = useCallback(async (key: string) => {
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
    } else {
       setAvailableModels([]);
       const errorMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: '无法获取模型列表。请检查您的API密钥是否正确或网络连接是否正常。',
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, errorMsg]);
    }
  }, []);

  useEffect(() => {
    const storedApiKey = localStorage.getItem('gemini_api_key');
    const storedModel = localStorage.getItem('gemini_model');

    if (storedApiKey) {
      setApiKey(storedApiKey);
      if (availableModels.length === 0) {
          updateModels(storedApiKey);
      }
    } else {
      setIsSettingsOpen(true);
    }
    
    if (storedModel) {
        setModel(storedModel)
    }
  }, [updateModels, availableModels.length]);

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
    
    if (availableModels.length === 0 && !model) {
        const errorMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: '没有可用的模型。请检查您的API密钥或刷新页面重试。',
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
                ? { ...msg, content: (msg.content as string) + chunk }
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
                : msg
        ));
        setIsLoading(false);
      }
    );

  }, [apiKey, messages, model, availableModels]);

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gemini-bg">
      <div className="flex-1 flex flex-col overflow-hidden w-full max-w-4xl mx-auto">
        <header className="flex items-center justify-between p-4 text-gemini-text">
            <button onClick={clearChat} className="flex items-center gap-2 p-2 rounded-full hover:bg-gemini-input-bg transition-colors" aria-label="新聊天">
                <RefreshIcon className="w-5 h-5"/>
                <span className="text-sm">新聊天</span>
            </button>
            <h1 className="text-xl font-semibold bg-gemini-gradient bg-clip-text text-transparent">Gemini</h1>
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-full hover:bg-gemini-input-bg transition-colors"
                aria-label="打开设置"
            >
                <SettingsIcon className="w-6 h-6" />
            </button>
        </header>

        <ChatWindow messages={messages} isLoading={isLoading} onSuggestionClick={handleSuggestionClick} />
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
