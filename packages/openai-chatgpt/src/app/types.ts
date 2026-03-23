export interface ChatGPTModelsResponse {
  readonly models: ChatGPTModel[];
  readonly categories: ChatGPTCategory[];
  readonly default_model_slug: string;
}

export interface ChatGPTModel {
  readonly slug: string;
  readonly max_tokens: number;
  readonly title: string;
  readonly description: string;
  readonly tags: string[];
  readonly capabilities: Record<string, unknown>;
  readonly product_features: Record<string, unknown>;
  readonly enabled_tools?: string[];
}

export interface ChatGPTCategory {
  readonly category: string;
  readonly human_category_name: string;
  readonly human_category_short_name: string;
  readonly subscription_level: string;
  readonly default_model: string;
  readonly supported_models: string[];
}
