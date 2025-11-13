import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CopyIcon, CheckIcon } from './icons';

interface CodeBlockProps {
  language: string;
  value: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, value }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div className="relative text-sm bg-gemini-bg rounded-lg my-4 border border-gemini-border">
      <div className="flex items-center justify-between px-4 py-2 bg-gemini-input-bg rounded-t-lg">
        <span className="text-gemini-text-secondary">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-gemini-text-secondary hover:text-gemini-text transition-colors"
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
        style={vscDarkPlus}
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