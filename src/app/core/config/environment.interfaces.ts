export interface EnvironmentApiConfig {
  readonly baseUrl: string;
  readonly version: string;
  readonly timeout?: number;
  readonly apiPrefix?: string;
}

export interface Environment {
  readonly production: boolean;
  readonly api: EnvironmentApiConfig;
  readonly features: {
    readonly enableAnalytics: boolean;
    readonly enableDebugMode: boolean;
  };
}
