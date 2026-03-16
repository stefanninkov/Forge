// Centralized Claude API client for AI-powered features

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

interface ClaudeRequestOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  system?: string;
  messages: ClaudeMessage[];
}

export class ClaudeClient {
  private apiKey: string;
  private defaultModel = 'claude-sonnet-4-6';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async complete(options: ClaudeRequestOptions): Promise<{ text: string; usage: { input: number; output: number } }> {
    const {
      model = this.defaultModel,
      maxTokens = 4096,
      temperature = 0.3,
      system,
      messages,
    } = options;

    const body: Record<string, unknown> = {
      model,
      max_tokens: maxTokens,
      temperature,
      messages,
    };

    if (system) {
      body.system = system;
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Claude API error', { status: res.status, body: errorText });
      throw new Error(`Claude API error (${res.status}): ${errorText}`);
    }

    const data = (await res.json()) as ClaudeResponse;
    const text = data.content
      .filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('');

    return {
      text,
      usage: {
        input: data.usage.input_tokens,
        output: data.usage.output_tokens,
      },
    };
  }

  async completeJson<T>(options: ClaudeRequestOptions): Promise<{ data: T; usage: { input: number; output: number } }> {
    const result = await this.complete(options);

    // Extract JSON from the response — handle markdown code blocks
    let jsonStr = result.text.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonStr = jsonMatch[1].trim();
    }

    try {
      const parsed = JSON.parse(jsonStr) as T;
      return { data: parsed, usage: result.usage };
    } catch {
      console.error('Failed to parse Claude JSON response', result.text.slice(0, 500));
      throw new Error('Failed to parse AI response as JSON');
    }
  }
}

/** Create a ClaudeClient instance from an API key */
export function createClaudeClient(apiKey: string): ClaudeClient {
  return new ClaudeClient(apiKey);
}
