import { useState, useEffect, useCallback } from 'react';
import { Conversation, ChatMessage } from '../types';

export const useConversations = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

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
                    setActiveConversationId(parsed[0].id);
                }
            }
        } catch (error) {
            console.error("Failed to load conversations from local storage", error);
        }
    }, []);

    const saveConversations = useCallback((updatedConversations: Conversation[]) => {
        try {
            setConversations(updatedConversations);
            localStorage.setItem('gemini_conversations', JSON.stringify(updatedConversations));
        } catch (error) {
            console.error("Failed to save conversations to local storage", error);
        }
    }, []);
    
    useEffect(() => {
        if(activeConversationId) {
            localStorage.setItem('gemini_active_conversation_id', activeConversationId);
        }
    }, [activeConversationId]);

    const createNewConversation = useCallback(() => {
        const newConversation: Conversation = {
            id: `conv_${Date.now()}`,
            title: '新对话',
            messages: [],
            createdAt: Date.now(),
        };
        const updatedConversations = [newConversation, ...conversations];
        saveConversations(updatedConversations);
        setActiveConversationId(newConversation.id);
        return newConversation.id;
    }, [conversations, saveConversations]);
    
    const deleteConversation = useCallback((id: string) => {
        const updatedConversations = conversations.filter(c => c.id !== id);
        saveConversations(updatedConversations);
        if (activeConversationId === id) {
            setActiveConversationId(updatedConversations.length > 0 ? updatedConversations[0].id : null);
        }
    }, [conversations, activeConversationId, saveConversations]);
    
    const updateConversationTitle = useCallback((id: string, title: string) => {
        const updatedConversations = conversations.map(c => 
            c.id === id ? { ...c, title } : c
        );
        saveConversations(updatedConversations);
    }, [conversations, saveConversations]);

    const addMessageToConversation = useCallback((
        conversationId: string, 
        messageOrChunk: ChatMessage | ChatMessage[] | string, 
        overwriteLast?: boolean
    ) => {
        setConversations(prev => {
            const updatedConversations = prev.map(c => {
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

            localStorage.setItem('gemini_conversations', JSON.stringify(updatedConversations));
            return updatedConversations;
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