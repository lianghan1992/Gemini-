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
  
  // Ensure the selected model is always in the available list when the list changes
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4 relative">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">设置</h2>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
          <CloseIcon className="w-6 h-6" />
        </button>
        <div className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              API 密钥
            </label>
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="请在此处输入您的 API 密钥"
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100"
            />
          </div>
           <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              模型
            </label>
            <select
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-gray-900 dark:text-gray-100"
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
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;