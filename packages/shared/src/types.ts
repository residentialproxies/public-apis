export enum AuthType {
  NO = "No",
  API_KEY = "apiKey",
  OAUTH = "OAuth",
  X_MASHAPE_KEY = "X-Mashape-Key",
  USER_AGENT = "User-Agent",
  UNKNOWN = "Unknown",
}

export const AUTH_TYPE_MAP: Record<string, AuthType> = {
  no: AuthType.NO,
  "": AuthType.NO,
  apikey: AuthType.API_KEY,
  "api key": AuthType.API_KEY,
  oauth: AuthType.OAUTH,
  "x-mashape-key": AuthType.X_MASHAPE_KEY,
  "user-agent": AuthType.USER_AGENT,
};

export function parseAuthType(raw: string | null | undefined): AuthType {
  const normalized = (raw ?? "").toLowerCase().trim().replaceAll("`", "");
  return AUTH_TYPE_MAP[normalized] ?? AuthType.UNKNOWN;
}

export enum CorsStatus {
  YES = "Yes",
  NO = "No",
  UNKNOWN = "Unknown",
}

export const CORS_MAP: Record<string, CorsStatus> = {
  yes: CorsStatus.YES,
  no: CorsStatus.NO,
  unknown: CorsStatus.UNKNOWN,
  "": CorsStatus.UNKNOWN,
};

export function parseCorsStatus(raw: string | null | undefined): CorsStatus {
  const normalized = (raw ?? "").toLowerCase().trim();
  return CORS_MAP[normalized] ?? CorsStatus.UNKNOWN;
}

export enum HealthStatus {
  LIVE = "live",
  DOWN = "down",
  UNKNOWN = "unknown",
  SLOW = "slow",
  PENDING = "pending",
}

export enum SyncStatus {
  ACTIVE = "active",
  ARCHIVED = "archived",
  ERROR = "error",
}
