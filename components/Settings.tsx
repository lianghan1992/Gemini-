import React, { useState, useEffect } from 'react';
import { CloseIcon } from './icons';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string, model: string) => void;
  initialApiKey: string;
  initialModel: string;
  availableModels: string[];
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose, onSave, initialApiKey, initialModel, availableModels }) => {
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [model, setModel] = useState(initialModel);

  useEffect(() => {
    setApiKey(initialApiKey);
    setModel(initialModel);
  }, [initialApiKey, initialModel, isOpen]);
  
  useEffect(() => {
    if (availableModels.length > 0 && !availableModels.includes(model)) {
      setModel(availableModels[0]);
    }
  }, [availableModels, model]);


  if (!isOpen) return null;

  const handleSave = () => {
    onSave(apiKey, model);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center font-sans">
      <div className="bg-gemini-chat-bg rounded-lg shadow-xl p-6 w-full max-w-md m-4 relative border border-gemini-border">
        <h2 className="text-xl font-semibold mb-4 text-gemini-text">设置</h2>
        <button onClick={onClose} className="absolute top-4 right-4 text-gemini-text-secondary hover:text-gemini-text">
          <CloseIcon className="w-6 h-6" />
        </button>
        <div className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gemini-text-secondary">
              API 密钥
            </label>
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="请在此处输入您的 API 密钥"
              className="mt-1 block w-full px-3 py-2 bg-gemini-input-bg border border-gemini-border rounded-md shadow-sm placeholder-gemini-text-secondary focus:outline-none focus:ring-gemini-accent-start focus:border-gemini-accent-start sm:text-sm text-gemini-text"
            />
          </div>
           <div>
            <label htmlFor="model" className="block text-sm font-medium text-gemini-text-secondary">
              模型
            </label>
            <select
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gemini-input-bg border border-gemini-border focus:outline-none focus:ring-gemini-accent-start focus:border-gemini-accent-start sm:text-sm rounded-md text-gemini-text"
            >
              {availableModels.length > 0 ? (
                availableModels.map(modelName => <option key={modelName} value={modelName}>{modelName}</option>)
              ) : (
                <option value={model} disabled>{model}</option>
              )}
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-gemini-accent-start text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gemini-accent-end focus:ring-offset-gemini-chat-bg"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;