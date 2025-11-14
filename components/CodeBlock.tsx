import React, { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CopyIcon, CheckIcon } from './icons';

interface CodeBlockProps {
  language: string;
  value: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, value }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [currentStyle, setCurrentStyle] = useState({});

  useEffect(() => {
      const updateStyle = () => {
          const isDark = document.documentElement.classList.contains('dark');
          setCurrentStyle(isDark ? vscDarkPlus : materialLight);
      };

      updateStyle(); // Set initial style

      const observer = new MutationObserver(updateStyle);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

      return () => observer.disconnect();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div className="relative text-sm bg-user-bg dark:bg-[#1E1E1E] rounded-lg my-4 border border-border dark:border-dark-border">
      <div className="flex items-center justify-between px-4 py-2 bg-sidebar dark:bg-dark-input-bg rounded-t-lg">
        <span className="text-text-secondary dark:text-dark-text-secondary">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary transition-colors"
        >
          {isCopied ? (
            <>
              <CheckIcon className="w-4 h-4" />
              已复制!
            </>
          ) : (
            <>
              <CopyIcon className="w-4 h-4" />
              复制
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={currentStyle}
        customStyle={{ 
            margin: 0, 
            padding: '1rem',
            backgroundColor: 'transparent',
            borderRadius: '0 0 0.5rem 0.5rem',
        }}
        codeTagProps={{
            style: {
                fontFamily: '"Fira Code", "Courier New", monospace',
                fontSize: '0.875rem'
            }
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodeBlock;