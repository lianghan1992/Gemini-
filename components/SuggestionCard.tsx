import React from 'react';

interface SuggestionCardProps {
    title: string;
    description: string;
    onClick: () => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ title, description, onClick }) => {
    return (
        <div 
            onClick={onClick}
            className="p-4 bg-gemini-input-bg rounded-lg cursor-pointer hover:bg-gemini-user-bg transition-colors border border-transparent hover:border-gemini-border"
        >
            <h3 className="font-semibold text-gemini-text">{title}</h3>
            <p className="text-sm text-gemini-text-secondary mt-1">{description}</p>
        </div>
    );
};

export default SuggestionCard;