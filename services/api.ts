
import { ChatMessage } from '../types';

interface ApiPayload {
  model: string;
  messages: {
    role: 'user' | 'assistant';
    content: ChatMessage['content'];
  }[];
  stream: boolean;
}

interface ApiResponse {
  choices: {
    message: {
      role: 'assistant';
      content: string;
    };
  }[];
}

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};


export const fetchChatCompletion = async (
  messages: ChatMessage[],
  apiKey: string,
  baseUrl: string
): Promise<string> => {
  const url = `${baseUrl}v1/chat/completions`;

  const payload: ApiPayload = {
    model: 'gemini-2.5-flash',
    messages: messages.map(({ role, content }) => ({ role, content })).filter(m => m.role !== 'system') as ApiPayload['messages'],
    stream: false,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('API Error Response:', errorBody);
      throw new Error(`API 请求失败，状态码: ${response.status}. ${errorBody}`);
    }

    const data: ApiResponse = await response.json();
    
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content;
    }

    throw new Error('API 响应中没有找到有效的回答');
  } catch (error) {
    console.error('调用 API 时出错:', error);
    if (error instanceof Error) {
        return `发生错误: ${error.message}`;
    }
    return '发生未知错误';
  }
};
