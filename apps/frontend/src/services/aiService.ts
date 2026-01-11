import { Node, Connection } from '../types/canvas';
import { useSettingsStore, AIProvider } from '../stores/settingsStore';
import { formatSchemaForAI, getLayoutGuidelines } from '@flowdyno/shared-config';

export interface GenerateArchitectureRequest {
  prompt: string;
  complexity?: 'simple' | 'detailed';
  maxNodes?: number;
}

export interface GenerateArchitectureResponse {
  nodes: Node[];
  connections: Connection[];
  metadata: {
    generatedAt: string;
    model: string;
    tokensUsed?: number;
  };
}

const SYSTEM_PROMPT = `You are an expert system architect specializing in creating clear, professional architecture diagrams.

Your task: Generate architecture diagrams based on user descriptions. Return ONLY a valid JSON object.

${formatSchemaForAI()}

${getLayoutGuidelines()}

CRITICAL RULES:
1. Node Count: Create 5-15 nodes depending on complexity (simple: 5-8, detailed: 10-15)
2. Node Types: Use appropriate types (service, database, cache, queue, api, frontend, backend, cloud, devops, monitoring, concept)
3. Icon Names: Use lowercase technology names (e.g., "react", "postgresql", "redis", "kubernetes", "docker", "aws")
4. Positioning: Follow layout guidelines strictly to avoid overlaps
5. Connections: NEVER create bidirectional connections between the same nodes
6. Colors: Use different colors to distinguish connection types (data flow, events, API calls)
7. Line Styles: Use solid for sync/required, dashed for async/optional
8. Labels: Provide clear, concise labels for all nodes and connections
9. Frame Usage: Use frames to group related services/components
10. Output Format: Return ONLY the JSON object, no markdown code blocks, no additional text

Example of good architecture for "E-commerce system with microservices":
{
  "nodes": [
    { "id": "web", "type": "frontend", "label": "Web App", "icon": "react", "position": { "x": 400, "y": 100 } },
    { "id": "api-gateway", "type": "api", "label": "API Gateway", "icon": "nginx", "position": { "x": 400, "y": 350 } },
    { "id": "user-svc", "type": "service", "label": "User Service", "icon": "nodejs", "position": { "x": 150, "y": 600 } },
    { "id": "order-svc", "type": "service", "label": "Order Service", "icon": "nodejs", "position": { "x": 450, "y": 600 } },
    { "id": "payment-svc", "type": "service", "label": "Payment Service", "icon": "nodejs", "position": { "x": 750, "y": 600 } },
    { "id": "postgres", "type": "database", "label": "PostgreSQL", "icon": "postgresql", "position": { "x": 300, "y": 850 } },
    { "id": "redis", "type": "cache", "label": "Redis Cache", "icon": "redis", "position": { "x": 600, "y": 850 } }
  ],
  "connections": [
    { "id": "c1", "from": "web", "to": "api-gateway", "label": "HTTPS", "lineStyle": "solid", "edgeType": "smoothstep", "fromAnchor": "bottom", "toAnchor": "top", "color": "#00f0ff" },
    { "id": "c2", "from": "api-gateway", "to": "user-svc", "label": "REST", "lineStyle": "solid", "edgeType": "smoothstep", "fromAnchor": "bottom", "toAnchor": "top", "color": "#00ff88" },
    { "id": "c3", "from": "api-gateway", "to": "order-svc", "label": "REST", "lineStyle": "solid", "edgeType": "smoothstep", "fromAnchor": "bottom", "toAnchor": "top", "color": "#00ff88" },
    { "id": "c4", "from": "api-gateway", "to": "payment-svc", "label": "REST", "lineStyle": "solid", "edgeType": "smoothstep", "fromAnchor": "bottom", "toAnchor": "top", "color": "#00ff88" },
    { "id": "c5", "from": "user-svc", "to": "postgres", "label": "SQL", "lineStyle": "solid", "edgeType": "smoothstep", "fromAnchor": "bottom", "toAnchor": "top", "color": "#3b82f6" },
    { "id": "c6", "from": "order-svc", "to": "postgres", "label": "SQL", "lineStyle": "solid", "edgeType": "smoothstep", "fromAnchor": "bottom", "toAnchor": "top", "color": "#3b82f6" },
    { "id": "c7", "from": "order-svc", "to": "redis", "label": "Cache", "lineStyle": "dashed", "edgeType": "smoothstep", "fromAnchor": "bottom", "toAnchor": "top", "color": "#eab308" }
  ]
}`;

interface AIProviderConfig {
  endpoint: string;
  headers: (apiKey: string) => Record<string, string>;
  body: (prompt: string) => any;
  parseResponse: (data: any) => string;
}

const PROVIDER_CONFIGS: Record<AIProvider, AIProviderConfig> = {
  openai: {
    endpoint: 'https://api.openai.com/v1/chat/completions',
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    }),
    body: (prompt) => ({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
    parseResponse: (data) => data.choices[0].message.content,
  },
  anthropic: {
    endpoint: 'https://api.anthropic.com/v1/messages',
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    }),
    body: (prompt) => ({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    }),
    parseResponse: (data) => data.content[0].text,
  },
  google: {
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
    body: (prompt) => ({
      contents: [
        {
          parts: [{ text: `${SYSTEM_PROMPT}\n\nUser request: ${prompt}` }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    }),
    parseResponse: (data) => data.candidates[0].content.parts[0].text,
  },
  deepseek: {
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    }),
    body: (prompt) => ({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    }),
    parseResponse: (data) => data.choices[0].message.content,
  },
};

export async function generateArchitecture(
  request: GenerateArchitectureRequest
): Promise<GenerateArchitectureResponse> {
  const settingsStore = useSettingsStore.getState();
  const provider = settingsStore.selectedProvider;
  const apiKey = settingsStore.getApiKey();

  if (!apiKey) {
    throw new Error(
      `No API key configured for ${provider}. Please configure your API key in Settings.`
    );
  }

  const config = PROVIDER_CONFIGS[provider];
  const promptText = `Create a ${request.complexity || 'detailed'} architecture diagram for: ${request.prompt}${
    request.maxNodes ? ` (limit to ${request.maxNodes} nodes)` : ''
  }`;

  try {
    // For Google, append API key to URL
    const url = provider === 'google' ? `${config.endpoint}?key=${apiKey}` : config.endpoint;

    const response = await fetch(url, {
      method: 'POST',
      headers: config.headers(apiKey),
      body: JSON.stringify(config.body(promptText)),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message ||
          errorData.message ||
          `API request failed with status ${response.status}`
      );
    }

    const data = await response.json();
    const content = config.parseResponse(data);

    // Parse JSON from response
    let parsedContent;
    try {
      // Try to extract JSON if wrapped in markdown
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
      parsedContent = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : content);
    } catch (e) {
      throw new Error('Failed to parse AI response as JSON. Please try again.');
    }

    // Validate response structure
    if (!parsedContent.nodes || !Array.isArray(parsedContent.nodes)) {
      throw new Error('Invalid response: missing or invalid nodes array');
    }

    if (!parsedContent.connections || !Array.isArray(parsedContent.connections)) {
      throw new Error('Invalid response: missing or invalid connections array');
    }

    return {
      nodes: parsedContent.nodes,
      connections: parsedContent.connections,
      metadata: {
        generatedAt: new Date().toISOString(),
        model: provider,
        tokensUsed: data.usage?.total_tokens || undefined,
      },
    };
  } catch (error: any) {
    console.error('AI generation error:', error);
    throw new Error(error.message || 'Failed to generate architecture diagram');
  }
}
