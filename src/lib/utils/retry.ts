/**
 * Retry utility with exponential backoff
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
  onRetry?: (attempt: number, error: Error, nextDelayMs: number) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry' | 'retryableErrors'>> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: Error, retryableErrors?: string[]): boolean {
  const message = error.message.toLowerCase();
  
  // Default retryable conditions
  const defaultRetryable = [
    'timeout',
    'econnreset',
    'econnrefused',
    'etimedout',
    'socket hang up',
    'network error',
    'rate limit',
    '429',
    '500',
    '502',
    '503',
    '504',
  ];
  
  const retryPatterns = retryableErrors || defaultRetryable;
  
  return retryPatterns.some((pattern) => message.includes(pattern.toLowerCase()));
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = DEFAULT_OPTIONS.maxAttempts,
    initialDelayMs = DEFAULT_OPTIONS.initialDelayMs,
    maxDelayMs = DEFAULT_OPTIONS.maxDelayMs,
    backoffMultiplier = DEFAULT_OPTIONS.backoffMultiplier,
    retryableErrors,
    onRetry,
  } = options;

  let lastError: Error | null = null;
  let delayMs = initialDelayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Check if we should retry
      const shouldRetry = attempt < maxAttempts && isRetryableError(lastError, retryableErrors);
      
      if (!shouldRetry) {
        throw lastError;
      }
      
      // Calculate next delay with jitter
      const jitter = Math.random() * 0.3 * delayMs; // 0-30% jitter
      const actualDelay = Math.min(delayMs + jitter, maxDelayMs);
      
      console.log(`[Retry] Attempt ${attempt}/${maxAttempts} failed: ${lastError.message}`);
      console.log(`[Retry] Retrying in ${Math.round(actualDelay)}ms...`);
      
      if (onRetry) {
        onRetry(attempt, lastError, actualDelay);
      }
      
      await sleep(actualDelay);
      
      // Increase delay for next attempt
      delayMs = Math.min(delayMs * backoffMultiplier, maxDelayMs);
    }
  }

  throw lastError;
}

/**
 * Create a retryable version of an async function
 */
export function makeRetryable<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: RetryOptions = {}
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) => withRetry(() => fn(...args), options);
}

/**
 * Wrapper for API calls with standard retry settings
 */
export async function retryApiCall<T>(
  fn: () => Promise<T>,
  context: string = 'API call'
): Promise<T> {
  return withRetry(fn, {
    maxAttempts: 3,
    initialDelayMs: 2000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    onRetry: (attempt, error, delay) => {
      console.log(`[${context}] Retry ${attempt}: ${error.message}. Next attempt in ${Math.round(delay)}ms`);
    },
  });
}
