import React, { useState, useEffect } from 'react';
import { CloseIcon } from './icons';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    apiKey: string,
    model: string,
    systemPrompt: string,
    temperature: number,
    topP: number,
    maxTokens: number
  ) => void;
  initialApiKey: string;
  initialModel: string;
  availableModels: string[];
  initialSystemPrompt: string;
  initialTemperature: number;
  initialTopP: number;
  initialMaxTokens: number;
}

const Settings: React.FC<SettingsProps> = ({ 
    isOpen, onClose, onSave, 
    initialApiKey, initialModel, availableModels,
    initialSystemPrompt, initialTemperature, initialTopP, initialMaxTokens
}) => {
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [model, setModel] = useState(initialModel);
  const [systemPrompt, setSystemPrompt] = useState(initialSystemPrompt);
  const [temperature, setTemperature] = useState(initialTemperature);
  const [topP, setTopP] = useState(initialTopP);
  const [maxTokens, setMaxTokens] = useState(initialMaxTokens);

  useEffect(() => {
    setApiKey(initialApiKey);
    setModel(initialModel);
    setSystemPrompt(initialSystemPrompt);
    setTemperature(initialTemperature);
    setTopP(initialTopP);
    setMaxTokens(initialMaxTokens);
  }, [initialApiKey, initialModel, initialSystemPrompt, initialTemperature, initialTopP, initialMaxTokens, isOpen]);
  
  useEffect(() => {
    if (availableModels.length > 0 && !availableModels.includes(model)) {
      setModel(availableModels[0]);
    }
  }, [availableModels, model]);


  if (!isOpen) return null;

  const handleSave = () => {
    onSave(apiKey, model, systemPrompt, temperature, topP, maxTokens);
    onClose();
  };

  const commonInputClasses = "mt-1 block w-full px-3 py-2 bg-input-bg dark:bg-dark-input-bg border border-border dark:border-dark-border rounded-md shadow-sm placeholder-text-secondary dark:placeholder-dark-text-secondary focus:outline-none focus:ring-accent-start dark:focus:ring-dark-accent-start focus:border-accent-start dark:focus:border-dark-accent-start sm:text-sm text-text-primary dark:text-dark-text-primary";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center font-sans">
      <div className="bg-chat-bg dark:bg-dark-chat-bg rounded-lg shadow-xl p-6 w-full max-w-md m-4 relative border border-border dark:border-dark-border max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4 text-text-primary dark:text-dark-text-primary">设置</h2>
        <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary">
          <CloseIcon className="w-6 h-6" />
        </button>
        <div className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
              API 密钥
            </label>
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="请在此处输入您的 API 密钥"
              className={commonInputClasses}
            />
          </div>
           <div>
            <label htmlFor="model" className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
              模型
            </label>
            <select
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-input-bg dark:bg-dark-input-bg border border-border dark:border-dark-border focus:outline-none focus:ring-accent-start dark:focus:ring-dark-accent-start focus:border-accent-start dark:focus:border-dark-accent-start sm:text-sm rounded-md text-text-primary dark:text-dark-text-primary"
            >
              {availableModels.length > 0 ? (
                availableModels.map(modelName => <option key={modelName} value={modelName}>{modelName}</option>)
              ) : (
                <option value={model} disabled>{model}</option>
              )}
            </select>
          </div>

          <hr className="border-border dark:border-dark-border" />
          <h3 className="text-lg font-medium text-text-primary dark:text-dark-text-primary pt-2">高级设置</h3>
          
          <div>
            <label htmlFor="systemPrompt" className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                系统提示
            </label>
             <textarea 
                id="systemPrompt" 
                value={systemPrompt} 
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="例如: 你是一个乐于助人的助手。"
                rows={3}
                className={commonInputClasses + " resize-y"}
             />
             <p className="mt-1 text-xs text-text-secondary dark:text-dark-text-secondary">为 AI 设置整体行为或角色。</p>
          </div>

          <div>
            <label htmlFor="temperature" className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                Temperature: <span className="font-bold text-text-primary dark:text-dark-text-primary">{temperature.toFixed(1)}</span>
            </label>
            <input type="range" id="temperature" min="0" max="2" step="0.1" value={temperature} onChange={e => setTemperature(parseFloat(e.target.value))} className="w-full h-2 bg-user-bg rounded-lg appearance-none cursor-pointer dark:bg-dark-user-bg"/>
            <p className="mt-1 text-xs text-text-secondary dark:text-dark-text-secondary">较低的值更具确定性，较高的值更具创造性。</p>
          </div>

          <div>
            <label htmlFor="topP" className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                Top P: <span className="font-bold text-text-primary dark:text-dark-text-primary">{topP.toFixed(1)}</span>
            </label>
            <input type="range" id="topP" min="0" max="1" step="0.1" value={topP} onChange={e => setTopP(parseFloat(e.target.value))} className="w-full h-2 bg-user-bg rounded-lg appearance-none cursor-pointer dark:bg-dark-user-bg"/>
            <p className="mt-1 text-xs text-text-secondary dark:text-dark-text-secondary">控制多样性的一种方法。0.1 表示仅考虑包含前 10% 概率质量的词元。</p>
          </div>

          <div>
            <label htmlFor="maxTokens" className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                最大令牌数
            </label>
            <input
              type="number"
              id="maxTokens"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
              placeholder="例如: 2048"
              className={commonInputClasses}
            />
            <p className="mt-1 text-xs text-text-secondary dark:text-dark-text-secondary">响应中生成的最大令牌数。0 表示不限制。</p>
          </div>

        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-accent-start dark:bg-dark-accent-start text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-end dark:focus:ring-dark-accent-end focus:ring-offset-chat-bg dark:focus:ring-offset-dark-chat-bg"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
