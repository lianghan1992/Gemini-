import React, { useState, useEffect, useCallback } from 'react';
// FIX: Import `Conversation` type to resolve missing type error.
import { ChatMessage, MessageContentPart, Conversation } from './types';
import ChatWindow from './components/ChatWindow';
import MessageInput from './components/MessageInput';
import Settings from './components/Settings';
import Sidebar from './components/Sidebar';
import { MenuIcon } from './components/icons';
import { fetchChatCompletionStream, fileToBase64, fetchModels, generateTitleWithZhipu } from './services/api';
import { useTheme } from './hooks/useTheme';
import { useConversations } from './hooks/useConversations';


const App: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { 
      conversations,
      activeConversation,
      setActiveConversationId,
      createNewConversation,
      deleteConversation,
      addMessageToConversation,
      updateConversationTitle
  } = useConversations();
  
  const [apiKey, setApiKey] = useState<string>('');
  const [zhipuApiKey, setZhipuApiKey] = useState<string>('');
  const [baseUrl] = useState<string>('/api'); // 硬编码以匹配反向代理
  const [model, setModel] = useState<string>('gemini-2.5-flash');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Advanced settings state
  const [systemPrompt, setSystemPrompt] = useState<string>('You are a helpful assistant.');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [topP, setTopP] = useState<number>(1.0);
  const [maxTokens, setMaxTokens] = useState<number>(0);

  const updateModels = useCallback(async (key: string, url: string) => {
    if (!key || !url) return;
    const models = await fetchModels(key, url);
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
    }
  }, []);

  useEffect(() => {
    const storedApiKey = localStorage.getItem('gemini_api_key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
      if (availableModels.length === 0) {
          updateModels(storedApiKey, baseUrl);
      }
    } else {
      setIsSettingsOpen(true);
    }
    
    const storedZhipuApiKey = localStorage.getItem('gemini_zhipu_api_key');
    if (storedZhipuApiKey) setZhipuApiKey(storedZhipuApiKey);

    // Load advanced settings
    const storedSystemPrompt = localStorage.getItem('gemini_system_prompt');
    if (storedSystemPrompt) setSystemPrompt(storedSystemPrompt);

    const storedTemperature = localStorage.getItem('gemini_temperature');
    if (storedTemperature) setTemperature(parseFloat(storedTemperature));

    const storedTopP = localStorage.getItem('gemini_top_p');
    if (storedTopP) setTopP(parseFloat(storedTopP));

    const storedMaxTokens = localStorage.getItem('gemini_max_tokens');
    if (storedMaxTokens) setMaxTokens(parseInt(storedMaxTokens, 10));

  }, [updateModels, availableModels.length, baseUrl]);

  const handleSaveSettings = (
      newApiKey: string, newModel: string, newSystemPrompt: string,
      newTemperature: number, newTopP: number, newMaxTokens: number,
      newZhipuApiKey: string,
    ) => {
    setApiKey(newApiKey);
    setZhipuApiKey(newZhipuApiKey);
    setModel(newModel);
    setSystemPrompt(newSystemPrompt);
    setTemperature(newTemperature);
    setTopP(newTopP);
    setMaxTokens(newMaxTokens);

    localStorage.setItem('gemini_api_key', newApiKey);
    localStorage.setItem('gemini_zhipu_api_key', newZhipuApiKey);
    localStorage.setItem('gemini_model', newModel);
    localStorage.setItem('gemini_system_prompt', newSystemPrompt);
    localStorage.setItem('gemini_temperature', newTemperature.toString());
    localStorage.setItem('gemini_top_p', newTopP.toString());
    localStorage.setItem('gemini_max_tokens', newMaxTokens.toString());
    
    updateModels(newApiKey, baseUrl);
  };

  const handleSendMessage = useCallback(async (text: string, file?: File) => {
    if (!apiKey) {
      setIsSettingsOpen(true);
      return;
    }

    const isNewConversation = !activeConversation?.id;
    let currentConversationId = activeConversation?.id;

    if (isNewConversation) {
        currentConversationId = createNewConversation();
        const userMessageText = text || (file ? "图像消息" : "");
        if (userMessageText) {
            const tempTitle = userMessageText.substring(0, 20) + (userMessageText.length > 20 ? '...' : '');
            updateConversationTitle(currentConversationId, tempTitle);
        }
    }
    
    let content: string | MessageContentPart[] = text;
    if (file) {
        try {
            const base64Image = await fileToBase64(file);
            const imagePart: MessageContentPart = { type: 'image_url', image_url: { url: base64Image } };
            content = text ? [{ type: 'text', text }, imagePart] : [imagePart];
        } catch (error) {
            console.error("图片转换失败:", error);
            const errorMsg: ChatMessage = {
                id: Date.now().toString(), role: 'assistant',
                content: '图片处理失败，请重试。', timestamp: Date.now(),
            };
            addMessageToConversation(currentConversationId!, errorMsg);
            return;
        }
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(), role: 'user', content, timestamp: Date.now(),
    };
    
    const messagesForApi = [...(activeConversation?.messages || []), userMessage];
    
    const assistantId = (Date.now() + 1).toString();
    const assistantMessage: ChatMessage = {
        id: assistantId, role: 'assistant', content: '', timestamp: Date.now(),
    };
    
    addMessageToConversation(currentConversationId!, [userMessage, assistantMessage]);
    setIsLoading(true);

    fetchChatCompletionStream(
        messagesForApi, apiKey, baseUrl, model,
        systemPrompt, temperature, topP, maxTokens,
        (chunk) => {
            addMessageToConversation(currentConversationId!, chunk);
        },
        () => {
            setIsLoading(false);
            if (isNewConversation && zhipuApiKey) {
                // The conversation state will be updated, find the latest version
                const finalConversation = conversations.find(c => c.id === currentConversationId!);
                const finalMessages = [...(finalConversation?.messages || []), userMessage];
                // The final assistant message is not in `finalConversation.messages` yet due to streaming
                // so we pass the userMessage to ensure the API has context.
                // A better approach is to get the final state from the hook. For now, this is a good approximation.
                
                // Let's get the most up-to-date conversation from local storage to be safe
                const latestConvos: Conversation[] = JSON.parse(localStorage.getItem('gemini_conversations') || '[]');
                const updatedConv = latestConvos.find(c => c.id === currentConversationId!);

                if (updatedConv && updatedConv.messages.length > 0) {
                    generateTitleWithZhipu(updatedConv.messages, zhipuApiKey)
                    .then(title => {
                        if (title && title !== '新对话') {
                            updateConversationTitle(currentConversationId!, title);
                        }
                    })
                    .catch(err => {
                        console.error("Zhipu title generation failed, keeping temporary title.", err);
                    });
                }
            }
        },
        (error) => {
            const errorContent = `出现错误: ${error.message}`;
            addMessageToConversation(currentConversationId!, errorContent, true);
            setIsLoading(false);
        }
    );
  }, [apiKey, baseUrl, model, activeConversation, createNewConversation, addMessageToConversation, updateConversationTitle, systemPrompt, temperature, topP, maxTokens, zhipuApiKey, conversations]);

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };
  
  const handleNewChat = () => {
    const newId = createNewConversation();
    setActiveConversationId(newId);
    setIsSidebarOpen(false);
  }


  return (
    <div className="h-screen w-screen flex font-sans bg-background dark:bg-dark-background text-text-primary dark:text-dark-text-primary overflow-hidden">
        <Sidebar 
            conversations={conversations}
            activeConversationId={activeConversation?.id || null}
            onConversationSelect={(id) => {
                setActiveConversationId(id);
                setIsSidebarOpen(false);
            }}
            onNewChat={handleNewChat}
            onDeleteConversation={deleteConversation}
            onSettingsClick={() => setIsSettingsOpen(true)}
            theme={theme}
            onThemeChange={setTheme}
            isOpen={isSidebarOpen}
            setIsOpen={setIsSidebarOpen}
        />
        
        <div className="flex-1 flex flex-col h-full">
            <header className="flex md:hidden items-center justify-between p-2 border-b border-border dark:border-dark-border">
                <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 rounded-md hover:bg-sidebar dark:hover:bg-dark-sidebar"
                >
                    <MenuIcon className="w-6 h-6"/>
                </button>
                <h1 className="text-lg font-semibold truncate px-2">
                    {activeConversation?.title || '新对话'}
                </h1>
                <div className="w-8"></div>
            </header>

            <main className="flex-1 flex flex-col overflow-hidden">
                <ChatWindow 
                    conversation={activeConversation} 
                    isLoading={isLoading} 
                    onSuggestionClick={handleSuggestionClick} 
                />
                <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
            </main>
        </div>

        <Settings
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            onSave={handleSaveSettings}
            initialApiKey={apiKey}
            initialZhipuApiKey={zhipuApiKey}
            initialModel={model}
            availableModels={availableModels}
            initialSystemPrompt={systemPrompt}
            initialTemperature={temperature}
            initialTopP={topP}
            initialMaxTokens={maxTokens}
        />
    </div>
  );
};

export default App;