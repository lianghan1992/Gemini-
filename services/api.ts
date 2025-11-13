import { ChatMessage } from '../types';

interface ApiPayload {
  model: string;
  messages: {
    role: 'user' | 'assistant' | 'system';
    content: ChatMessage['content'];
  }[];
  stream: boolean;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
}

interface ApiModel {
    id: string;
    object: string;
    created: number;
    owned_by: string;
}

interface ApiModelsResponse {
    object: 'list';
    data: ApiModel[];
}


export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const fetchModels = async (apiKey: string, baseUrl: string): Promise<string[]> => {
    const url = `${baseUrl.replace(/\/$/, "")}/v1/models`;
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });
        if (!response.ok) {
            throw new Error(`获取模型列表失败: ${response.status}`);
        }
        const data: ApiModelsResponse = await response.json();
        return data.data.map(model => model.id).sort();
    } catch (error) {
        console.error("获取模型时出错:", error);
        return [];
    }
}

export const generateTitle = async (
  userMessage: ChatMessage['content'],
  apiKey: string,
  baseUrl: string,
  model: string
): Promise<string> => {
    const url = `${baseUrl.replace(/\/$/, "")}/v1/chat/completions`;
    const userContent = typeof userMessage === 'string' ? userMessage : (
        Array.isArray(userMessage) 
        ? userMessage.find(p => p.type === 'text')?.text || 'Image Conversation'
        : 'New Conversation'
    );

    const prompt = `为以下对话生成一个简短、简洁的标题（不超过5个词）:\n\n用户: "${userContent.substring(0, 100)}..."\n\n标题:`;

    const payload = {
        model,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        max_tokens: 20,
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
            return "新对话";
        }
        const data = await response.json();
        let title = data.choices?.[0]?.message?.content?.trim().replace(/["']/g, "") || "新对话";
        return title;
    } catch (error) {
        console.error("生成标题失败:", error);
        return "新对话";
    }
};


export const fetchChatCompletionStream = async (
  messages: ChatMessage[],
  apiKey: string,
  baseUrl: string,
  model: string,
  systemPrompt: string | undefined,
  temperature: number | undefined,
  topP: number | undefined,
  maxTokens: number | undefined,
  onUpdate: (chunk: string) => void,
  onFinish: () => void,
  onError: (error: Error) => void
) => {
  const url = `${baseUrl.replace(/\/$/, "")}/v1/chat/completions`;
  
  const apiMessages: ApiPayload['messages'] = messages
    .map(({ role, content }) => ({ role, content }))
    .filter(m => m.role === 'user' || m.role === 'assistant') as ApiPayload['messages'];

  if (systemPrompt && systemPrompt.trim() !== '') {
    apiMessages.unshift({ role: 'system', content: systemPrompt });
  }

  const payload: ApiPayload = {
    model: model,
    messages: apiMessages,
    stream: true,
  };
  
  if (temperature !== undefined) payload.temperature = temperature;
  if (topP !== undefined) payload.top_p = topP;
  if (maxTokens !== undefined && maxTokens > 0) payload.max_tokens = maxTokens;


  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok || !response.body) {
      const errorBody = await response.text();
      console.error('API Error Response:', errorBody);
      throw new Error(`API 请求失败，状态码: ${response.status}. ${errorBody}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const processStream = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '' || !line.startsWith('data:')) {
            continue;
          }
          
          const jsonStr = line.replace(/^data: /, '').trim();
          if (jsonStr === '[DONE]') {
            return;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              onUpdate(content);
            }
          } catch (e) {
            console.error('无法解析流中的JSON:', jsonStr, e);
          }
        }
      }
    };
    
    await processStream();
    onFinish();

  } catch (error) {
    console.error('调用 API 时出错:', error);
    if (error instanceof Error) {
        onError(error);
    } else {
        onError(new Error('发生未知错误'));
    }
  }
};
