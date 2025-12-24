/**
 * Custom error types for better error handling and debugging
 */

export class BackendError extends Error {
  constructor(
    public status: number,
    public url: string,
    public body: string,
    public code?: string,
  ) {
    super(`Backend request failed: ${status} ${url}`);
    this.name = "BackendError";
  }
}

export class NetworkError extends Error {
  constructor(
    public url: string,
    public cause: Error,
  ) {
    super(`Network error: ${url} - ${cause.message}`);
    this.name = "NetworkError";
  }
}

export class TimeoutError extends Error {
  constructor(
    public url: string,
    public timeoutMs: number,
  ) {
    super(`Request timeout after ${timeoutMs}ms: ${url}`);
    this.name = "TimeoutError";
  }
}

export class ApiFetchError extends Error {
  constructor(
    message: string,
    public readonly endpoint: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = "ApiFetchError";
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Check if an error is a connection error (network/timeout)
 */
export function isConnectionError(error: unknown): boolean {
  if (error instanceof NetworkError || error instanceof TimeoutError) {
    return true;
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("fetch") ||
      message.includes("network") ||
      message.includes("timeout") ||
      message.includes("abort") ||
      message.includes("econnrefused")
    );
  }
  return false;
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof TimeoutError || error instanceof NetworkError) {
    return true;
  }
  if (error instanceof BackendError) {
    return [408, 429, 500, 502, 503, 504].includes(error.status);
  }
  return false;
}

/**
 * Get a user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof TimeoutError) {
    return "Request timed out. Please try again.";
  }
  if (error instanceof NetworkError) {
    return "Network error. Please check your connection and try again.";
  }
  if (error instanceof BackendError) {
    switch (error.status) {
      case 404:
        return "The requested resource was not found.";
      case 429:
        return "Too many requests. Please try again later.";
      case 500:
      case 502:
      case 503:
        return "Server error. Please try again later.";
      default:
        return `Request failed: ${error.status}`;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unknown error occurred.";
}
