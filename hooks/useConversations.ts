import { useState, useEffect, useCallback } from 'react';
import { Conversation, ChatMessage } from '../types';

export const useConversations = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

    // 从 localStorage 加载初始状态
    useEffect(() => {
        try {
            const savedConversations = localStorage.getItem('gemini_conversations');
            if (savedConversations) {
                const parsed = JSON.parse(savedConversations) as Conversation[];
                setConversations(parsed);
                const lastActiveId = localStorage.getItem('gemini_active_conversation_id');
                if (lastActiveId && parsed.some(c => c.id === lastActiveId)) {
                    setActiveConversationId(lastActiveId);
                } else if (parsed.length > 0) {
                    // 默认激活最新的对话
                    setActiveConversationId(parsed[0].id);
                }
            }
        } catch (error) {
            console.error("从本地存储加载对话失败", error);
        }
    }, []);

    // 将对话状态异步持久化到 localStorage
    useEffect(() => {
        // 避免在初始加载时用空数组覆盖已有数据
        if (conversations.length > 0) {
            localStorage.setItem('gemini_conversations', JSON.stringify(conversations));
        }
    }, [conversations]);
    
    // 跟踪活动的对话 ID
    useEffect(() => {
        if(activeConversationId) {
            localStorage.setItem('gemini_active_conversation_id', activeConversationId);
        } else if (conversations.length === 0) {
            // 如果所有对话都被删除了，也移除 active id
            localStorage.removeItem('gemini_active_conversation_id');
        }
    }, [activeConversationId, conversations.length]);

    const createNewConversation = useCallback(() => {
        const newConversation: Conversation = {
            id: `conv_${Date.now()}`,
            title: '新对话',
            messages: [],
            createdAt: Date.now(),
        };
        // 确保新对话显示在最前面
        setConversations(prev => [newConversation, ...prev]);
        setActiveConversationId(newConversation.id);
        return newConversation.id;
    }, []);
    
    const deleteConversation = useCallback((id: string) => {
        const updatedConversations = conversations.filter(c => c.id !== id);
        setConversations(updatedConversations);
        if (activeConversationId === id) {
            setActiveConversationId(updatedConversations.length > 0 ? updatedConversations[0].id : null);
        }
    }, [conversations, activeConversationId]);
    
    const updateConversationTitle = useCallback((id: string, title: string) => {
        setConversations(prev => prev.map(c => 
            c.id === id ? { ...c, title } : c
        ));
    }, []);

    const addMessageToConversation = useCallback((
        conversationId: string, 
        messageOrChunk: ChatMessage | ChatMessage[] | string, 
        overwriteLast?: boolean
    ) => {
        setConversations(prev => {
            return prev.map(c => {
                if (c.id === conversationId) {
                    let newMessages: ChatMessage[];
                    if (typeof messageOrChunk === 'string') { // It's a chunk for streaming or error message
                        newMessages = [...c.messages];
                        const lastMessage = newMessages[newMessages.length - 1];
                        if (lastMessage && lastMessage.role === 'assistant') {
                           const newContent = overwriteLast ? messageOrChunk : (lastMessage.content as string) + messageOrChunk;
                           newMessages[newMessages.length - 1] = { ...lastMessage, content: newContent };
                        }
                    } else if (Array.isArray(messageOrChunk)) { // It's an array of messages
                        newMessages = [...c.messages, ...messageOrChunk];
                    }
                    else { // It's a single full message object
                        newMessages = [...c.messages, messageOrChunk];
                    }
                    return { ...c, messages: newMessages };
                }
                return c;
            });
        });
    }, []);


    const activeConversation = conversations.find(c => c.id === activeConversationId) || null;

    return {
        conversations,
        activeConversation,
        setActiveConversationId,
        createNewConversation,
        deleteConversation,
        addMessageToConversation,
        updateConversationTitle
    };
};