export interface Integration {
  id: string;
  user_id: string;
  name: string;
  type: string;
  url?: string;
  username?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateIntegrationData {
  name: string;
  type: string;
  url?: string;
  username?: string;
  password?: string;
  api_key?: string;
}

export interface UpdateIntegrationData {
  name?: string;
  url?: string;
  username?: string;
  password?: string;
  api_key?: string;
}

export const INTEGRATION_TYPES = {
  KANBOARD: 'kanboard',
  // Add more integration types here as needed
} as const;

export type IntegrationType = typeof INTEGRATION_TYPES[keyof typeof INTEGRATION_TYPES];