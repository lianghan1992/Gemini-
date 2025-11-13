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
            className="p-4 bg-sidebar dark:bg-dark-input-bg rounded-lg cursor-pointer hover:bg-user-bg dark:hover:bg-dark-user-bg transition-colors border border-transparent hover:border-border dark:hover:border-dark-border"
        >
            <h3 className="font-semibold text-text-primary dark:text-dark-text-primary">{title}</h3>
            <p className="text-sm text-text-secondary dark:text-dark-text-secondary mt-1">{description}</p>
        </div>
    );
};

export default SuggestionCard;