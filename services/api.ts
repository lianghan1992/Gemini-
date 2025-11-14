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

// Helper to generate JWT for Zhipu AI
const generateJwtToken = async (apiKey: string): Promise<string> => {
    const [id, secret] = apiKey.split('.');
    if (!id || !secret) {
        throw new Error('无效的智谱AI API密钥格式。应为 "id.secret"。');
    }

    const now = Date.now();
    const payload = {
        api_key: id,
        exp: now + 2 * 60 * 1000, // Expires in 2 minutes
        timestamp: now,
    };
    
    const header = {
        alg: 'HS256',
        sign_type: 'SIGN',
    };

    // URL-safe Base64 encoding
    const toBase64Url = (data: string) => {
        return btoa(data)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    };
    
    const encodedHeader = toBase64Url(JSON.stringify(header));
    const encodedPayload = toBase64Url(JSON.stringify(payload));
    
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        new TextEncoder().encode(signatureInput)
    );

    // Convert ArrayBuffer to Base64 string
    const signatureBytes = new Uint8Array(signature);
    let binaryString = '';
    signatureBytes.forEach(byte => {
        binaryString += String.fromCharCode(byte);
    });
    
    const encodedSignature = toBase64Url(binaryString);

    return `${signatureInput}.${encodedSignature}`;
};


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

export const generateTitleWithZhipu = async (
  messages: ChatMessage[],
  apiKey: string
): Promise<string> => {
    const url = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
    
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');

    if (!lastUserMessage || !lastAssistantMessage) {
        return "新对话";
    }
    
    const userContent = typeof lastUserMessage.content === 'string' ? lastUserMessage.content : 
        (lastUserMessage.content.find(p => p.type === 'text')?.text || '');
    const assistantContent = typeof lastAssistantMessage.content === 'string' ? lastAssistantMessage.content : '';

    const prompt = `为以下对话生成一个简短、简洁的标题（不超过5个词，直接返回标题，不要任何多余的文字）:\n\n用户: "${userContent.substring(0, 100)}..."\n\n助手: "${assistantContent.substring(0, 150)}..."\n\n标题:`;

    const payload = {
        model: 'glm-4-flash-250414',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 20,
        temperature: 0.1,
    };

    try {
        const token = await generateJwtToken(apiKey);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Zhipu API request failed: ${response.status} ${errorBody}`);
        }

        const data = await response.json();
        let title = data.choices?.[0]?.message?.content?.trim().replace(/["'“”]/g, "") || "新对话";
        return title;
    } catch (error) {
        console.error("生成智谱标题失败:", error);
        throw error;
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
    let isFinished = false;

    while (!isFinished) {
        const { done, value } = await reader.read();
        
        if (done) {
            isFinished = true;
            // The stream is done, but the decoder might have buffered bytes.
            // A final decode() with no arguments flushes the buffer.
            buffer += decoder.decode();
        } else {
            buffer += decoder.decode(value, { stream: true });
        }
        
        // Process all complete lines in the buffer
        let boundary = buffer.lastIndexOf('\n');
        if (boundary === -1) {
            if(isFinished) { // If stream is finished, process the remaining buffer
                boundary = buffer.length;
            } else {
                continue; // Wait for more data if not finished
            }
        }
        
        const linesStr = buffer.substring(0, boundary);
        buffer = buffer.substring(boundary + 1);

        const lines = linesStr.split('\n');

        for (const line of lines) {
            if (line.trim() === '' || !line.startsWith('data:')) {
                continue;
            }
            
            const jsonStr = line.replace(/^data: /, '').trim();
            if (jsonStr === '[DONE]') {
                isFinished = true;
                break; // Exit the for...of loop
            }

            try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content != null) { // Handles empty string chunks correctly
                    onUpdate(content);
                }
            } catch (e) {
                console.error('无法解析流中的JSON:', jsonStr, e);
            }
        }
    }
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