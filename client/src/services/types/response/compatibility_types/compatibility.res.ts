export interface CompatibilityMessage {
  type: 'error' | 'warning' | 'info';
  text: string;
}

export interface CompatibilityResponse {
  isCompatible: boolean;
  messages: CompatibilityMessage[];
}
