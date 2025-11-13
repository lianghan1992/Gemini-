import React from 'react';
import { Conversation, Theme } from '../types';
import { PlusIcon, TrashIcon, SettingsIcon, SunIcon, MoonIcon, DesktopIcon, GeminiSparkIcon } from './icons';

interface SidebarProps {
    conversations: Conversation[];
    activeConversationId: string | null;
    onConversationSelect: (id: string) => void;
    onNewChat: () => void;
    onDeleteConversation: (id: string) => void;
    onSettingsClick: () => void;
    theme: Theme;
    onThemeChange: (theme: Theme) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    conversations, activeConversationId, onConversationSelect, onNewChat,
    onDeleteConversation, onSettingsClick, theme, onThemeChange, isOpen, setIsOpen
}) => {
    
    const ThemeButton: React.FC<{ value: Theme, icon: React.ReactNode }> = ({ value, icon }) => (
        <button
            onClick={() => onThemeChange(value)}
            className={`p-2 rounded-md ${theme === value ? 'bg-user-bg dark:bg-dark-user-bg' : ''} hover:bg-user-bg dark:hover:bg-dark-user-bg`}
        >
            {icon}
        </button>
    );

    const sidebarContent = (
        <div className="flex flex-col h-full bg-sidebar dark:bg-dark-sidebar text-text-primary dark:text-dark-text-primary">
            <div className="p-4 flex justify-between items-center border-b border-border dark:border-dark-border">
                <div className="flex items-center gap-2">
                    <GeminiSparkIcon className="w-8 h-8"/>
                    <h1 className="text-lg font-semibold">Gemini</h1>
                </div>
                <button 
                    onClick={onNewChat}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-user-bg dark:hover:bg-dark-user-bg transition-colors"
                >
                    <PlusIcon className="w-5 h-5"/>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {conversations.map(conv => (
                    <div 
                        key={conv.id} 
                        className={`group flex items-center justify-between p-2 rounded-md cursor-pointer ${activeConversationId === conv.id ? 'bg-user-bg dark:bg-dark-user-bg' : 'hover:bg-user-bg dark:hover:bg-dark-user-bg'}`}
                        onClick={() => onConversationSelect(conv.id)}
                    >
                        <span className="truncate text-sm">{conv.title}</span>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteConversation(conv.id); }}
                            className="text-text-secondary dark:text-dark-text-secondary opacity-0 group-hover:opacity-100 hover:text-red-500"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            <div className="p-4 border-t border-border dark:border-dark-border space-y-2">
                 <div className="flex items-center justify-around bg-background dark:bg-dark-background p-1 rounded-lg">
                     <ThemeButton value="light" icon={<SunIcon className="w-5 h-5" />} />
                     <ThemeButton value="dark" icon={<MoonIcon className="w-5 h-5" />} />
                     <ThemeButton value="system" icon={<DesktopIcon className="w-5 h-5" />} />
                 </div>
                 <button 
                    onClick={onSettingsClick}
                    className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-user-bg dark:hover:bg-dark-user-bg transition-colors"
                 >
                    <SettingsIcon className="w-5 h-5"/>
                    <span className="text-sm">设置</span>
                 </button>
            </div>
        </div>
    );
    
    return (
        <>
            {/* Mobile Overlay */}
            <div 
                className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
            />
            {/* Sidebar */}
            <aside className={`absolute md:relative z-40 md:z-auto w-64 h-full shrink-0 bg-sidebar dark:bg-dark-sidebar transition-transform transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                {sidebarContent}
            </aside>
        </>
    );
};

export default Sidebar;
