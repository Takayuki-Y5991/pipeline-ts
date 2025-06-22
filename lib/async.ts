import { Result, success, failure, isSuccess, isFailure } from './result';

/**
 * Options for retry functionality.
 */
export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: 'linear' | 'exponential';
  backoffFactor?: number;
  onRetry?: (attempt: number, error: any) => void;
}

/**
 * Executes functions in parallel and collects all results.
 * @template T - Array type of all function return values.
 * @template E - The type of the error.
 * @param {...Array<() => Promise<Result<any, E>>>} fns - Functions to execute in parallel.
 * @returns {Promise<Result<T, E[]>>} - Result containing array of values or array of errors.
 */
export const parallel = async <T extends readonly any[], E>(
  ...fns: { [K in keyof T]: () => Promise<Result<T[K], E>> }
): Promise<Result<T, E[]>> => {
  const results = await Promise.all(fns.map(fn => fn()));
  const errors: E[] = [];
  const values: any[] = [];

  for (const result of results) {
    if (isFailure(result)) {
      errors.push(result.error);
    } else {
      values.push(result.value);
    }
  }

  return errors.length > 0 ? failure(errors) : success(values as unknown as T);
};

/**
 * Executes functions in parallel and returns the first successful result.
 * @template T - The type of the value.
 * @template E - The type of the error.
 * @param {...Array<() => Promise<Result<T, E>>>} fns - Functions to execute.
 * @returns {Promise<Result<T, E[]>>} - First successful result or all errors.
 */
export const race = async <T, E>(
  ...fns: Array<() => Promise<Result<T, E>>>
): Promise<Result<T, E[]>> => {
  const results = await Promise.allSettled(fns.map(fn => fn()));
  const errors: E[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled' && isSuccess(result.value)) {
      return result.value;
    } else if (result.status === 'fulfilled' && isFailure(result.value)) {
      errors.push(result.value.error);
    }
  }

  return failure(errors);
};

/**
 * Executes functions sequentially, stopping on first failure.
 * @template T - Array type of all function return values.
 * @template E - The type of the error.
 * @param {...Array<() => Promise<Result<any, E>>>} fns - Functions to execute sequentially.
 * @returns {Promise<Result<T, E>>} - Result containing array of values or first error.
 */
export const sequential = async <T extends readonly any[], E>(
  ...fns: { [K in keyof T]: () => Promise<Result<T[K], E>> }
): Promise<Result<T, E>> => {
  const values: any[] = [];

  for (const fn of fns) {
    const result = await fn();
    if (isFailure(result)) {
      return result;
    }
    values.push(result.value);
  }

  return success(values as unknown as T);
};

/**
 * Retries a function with configurable options.
 * @template T - The type of the value.
 * @template E - The type of the error.
 * @param {() => Promise<Result<T, E>>} fn - Function to retry.
 * @param {RetryOptions} options - Retry configuration.
 * @returns {Promise<Result<T, E>>} - Result after retries.
 */
export const retry = async <T, E>(
  fn: () => Promise<Result<T, E>>,
  options: RetryOptions = {}
): Promise<Result<T, E>> => {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 'linear',
    backoffFactor = 2,
    onRetry
  } = options;

  let lastError: E;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await fn();
    
    if (isSuccess(result)) {
      return result;
    }

    lastError = result.error;

    if (attempt < maxAttempts) {
      if (onRetry) {
        onRetry(attempt, lastError);
      }

      const waitTime = backoff === 'exponential' 
        ? delay * Math.pow(backoffFactor, attempt - 1)
        : delay * attempt;

      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  return failure(lastError!);
};

/**
 * Applies a timeout to an async operation.
 * @template T - The type of the value.
 * @template E - The type of the error.
 * @param {() => Promise<Result<T, E>>} fn - Function to execute with timeout.
 * @param {number} ms - Timeout in milliseconds.
 * @param {E} timeoutError - Error to return on timeout.
 * @returns {Promise<Result<T, E>>} - Result or timeout error.
 */
export const withTimeout = async <T, E>(
  fn: () => Promise<Result<T, E>>,
  ms: number,
  timeoutError: E
): Promise<Result<T, E>> => {
  const timeout = new Promise<Result<T, E>>(resolve => 
    setTimeout(() => resolve(failure(timeoutError)), ms)
  );

  return Promise.race([fn(), timeout]);
};

/**
 * Batches multiple operations and executes them with concurrency control.
 * @template T - The type of the value.
 * @template E - The type of the error.
 * @param {Array<() => Promise<Result<T, E>>>} fns - Functions to execute.
 * @param {number} concurrency - Maximum concurrent executions.
 * @returns {Promise<Result<T[], E[]>>} - Results of all operations.
 */
export const batch = async <T, E>(
  fns: Array<() => Promise<Result<T, E>>>,
  concurrency: number
): Promise<Result<T[], E[]>> => {
  const results: Result<T, E>[] = [];
  const executing: Set<Promise<void>> = new Set();

  for (let i = 0; i < fns.length; i++) {
    const promise = fns[i]().then(result => {
      results[i] = result;
    }).then(() => {
      executing.delete(promise);
    });

    executing.add(promise);

    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);

  const errors: E[] = [];
  const values: T[] = [];

  for (const result of results) {
    if (isFailure(result)) {
      errors.push(result.error);
    } else {
      values.push(result.value);
    }
  }

  return errors.length > 0 ? failure(errors) : success(values);
};

/**
 * Debounces an async function.
 * @template T - The type of the value.
 * @template E - The type of the error.
 * @param {(...args: any[]) => Promise<Result<T, E>>} fn - Function to debounce.
 * @param {number} ms - Debounce delay in milliseconds.
 * @returns {(...args: any[]) => Promise<Result<T, E>>} - Debounced function.
 */
export const debounce = <T, E>(
  fn: (...args: any[]) => Promise<Result<T, E>>,
  ms: number
): ((...args: any[]) => Promise<Result<T, E>>) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastResolve: ((value: Result<T, E>) => void) | null = null;

  return (...args: any[]): Promise<Result<T, E>> => {
    return new Promise(resolve => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        if (lastResolve) {
          lastResolve(failure(new Error('Debounced') as any));
        }
      }

      lastResolve = resolve;
      timeoutId = setTimeout(async () => {
        const result = await fn(...args);
        resolve(result);
        timeoutId = null;
        lastResolve = null;
      }, ms);
    });
  };
};