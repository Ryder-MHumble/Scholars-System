export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly retryable: boolean,
    public readonly statusCode = 500,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorDetails(error: unknown): { code: string; message: string; retryable: boolean } {
  if (error instanceof AppError) {
    return { code: error.code, message: error.message, retryable: error.retryable };
  }
  if (error instanceof Error) {
    const retryable = error.name === "AbortError" || /fetch failed|timeout|ECONN|DeanAgent/i.test(error.message);
    return { code: retryable ? "UPSTREAM_UNAVAILABLE" : "ANALYSIS_FAILED", message: error.message, retryable };
  }
  return { code: "ANALYSIS_FAILED", message: "Unknown analysis failure", retryable: false };
}
