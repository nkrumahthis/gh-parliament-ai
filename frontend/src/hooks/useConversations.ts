import { useState, useEffect } from 'react';
import { Conversation } from '../types';

export const useConversations = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);

    const fetchConversations = async () => {
        try {
            const response = await fetch('http://localhost:8000/conversations');
            const data = await response.json();
            setConversations(data);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    };

    const loadConversation = async (conversationId: string) => {
        try {
            const response = await fetch(`http://localhost:8000/conversations/${conversationId}`);
            const conversation = await response.json();
            setActiveConversation(conversation);
        } catch (error) {
            console.error('Error loading conversation:', error);
        }
    };

    // Load conversations on mount
    useEffect(() => {
        fetchConversations();
    }, []);

    return {
        conversations,
        activeConversation,
        fetchConversations,
        loadConversation,
        setActiveConversation
    };
};