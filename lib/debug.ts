import { Result, isSuccess, isFailure } from './result';

/**
 * Debug configuration options.
 */
export interface DebugOptions {
  label?: string;
  includeTimestamp?: boolean;
  includeStack?: boolean;
  logger?: (message: string) => void;
}

/**
 * Default logger function.
 */
const defaultLogger = console.log;

/**
 * Inspects a result value with optional debugging information.
 * @template T - The type of the value in case of success.
 * @template E - The type of the error in case of failure.
 * @param {DebugOptions} options - Debug options.
 * @returns {(result: Result<T, E>) => Result<T, E>} - A function that inspects and returns the result.
 */
export const inspect =
  <T, E>(options: DebugOptions = {}) =>
  (result: Result<T, E>): Result<T, E> => {
    const {
      label = 'Result',
      includeTimestamp = false,
      includeStack = false,
      logger = defaultLogger
    } = options;

    const timestamp = includeTimestamp ? new Date().toISOString() : '';
    const prefix = timestamp ? `[${timestamp}] ${label}:` : `${label}:`;

    if (isSuccess(result)) {
      logger(`${prefix} Success ->`, result.value);
    } else {
      logger(`${prefix} Failure ->`, result.error);
      if (includeStack && result.error instanceof Error) {
        logger(`Stack trace:`, result.error.stack);
      }
    }

    return result;
  };

/**
 * Traces the execution time of a function.
 * @template T - The type of the value in case of success.
 * @template E - The type of the error in case of failure.
 * @param {string} label - Label for the trace.
 * @param {(result: Result<T, E>) => Result<T, E> | Promise<Result<T, E>>} fn - Function to trace.
 * @returns {(result: Result<T, E>) => Promise<Result<T, E>>} - A function that traces execution time.
 */
export const trace =
  <T, E>(
    label: string,
    fn: (result: Result<T, E>) => Result<T, E> | Promise<Result<T, E>>
  ) =>
  async (result: Result<T, E>): Promise<Result<T, E>> => {
    const start = performance.now();
    const output = await fn(result);
    const duration = performance.now() - start;
    
    console.log(`[Trace] ${label}: ${duration.toFixed(2)}ms`);
    
    return output;
  };

/**
 * Logs a custom message based on the result.
 * @template T - The type of the value in case of success.
 * @template E - The type of the error in case of failure.
 * @param {Object} messages - Custom messages for success and failure.
 * @param {(value: T) => string} messages.onSuccess - Message generator for success.
 * @param {(error: E) => string} messages.onFailure - Message generator for failure.
 * @param {(message: string) => void} logger - Logger function.
 * @returns {(result: Result<T, E>) => Result<T, E>} - A function that logs and returns the result.
 */
export const log =
  <T, E>(
    messages: {
      onSuccess?: (value: T) => string;
      onFailure?: (error: E) => string;
    },
    logger: (message: string) => void = defaultLogger
  ) =>
  (result: Result<T, E>): Result<T, E> => {
    if (isSuccess(result) && messages.onSuccess) {
      logger(messages.onSuccess(result.value));
    } else if (isFailure(result) && messages.onFailure) {
      logger(messages.onFailure(result.error));
    }
    
    return result;
  };

/**
 * Creates a breakpoint for debugging.
 * @template T - The type of the value in case of success.
 * @template E - The type of the error in case of failure.
 * @param {(result: Result<T, E>) => boolean} condition - Condition to trigger breakpoint.
 * @returns {(result: Result<T, E>) => Result<T, E>} - A function that conditionally triggers debugger.
 */
export const breakpoint =
  <T, E>(condition?: (result: Result<T, E>) => boolean) =>
  (result: Result<T, E>): Result<T, E> => {
    if (!condition || condition(result)) {
      debugger;
    }
    return result;
  };

/**
 * Asserts a condition on a successful result.
 * @template T - The type of the value in case of success.
 * @template E - The type of the error in case of failure.
 * @param {(value: T) => boolean} predicate - Assertion predicate.
 * @param {string} message - Error message if assertion fails.
 * @returns {(result: Result<T, E>) => Result<T, E | Error>} - A function that asserts and returns the result.
 */
export const assert =
  <T, E>(predicate: (value: T) => boolean, message: string) =>
  (result: Result<T, E>): Result<T, E | Error> => {
    if (isSuccess(result) && !predicate(result.value)) {
      throw new Error(`Assertion failed: ${message}. Value: ${JSON.stringify(result.value)}`);
    }
    return result;
  };

/**
 * Creates a pipeline debugger that tracks all transformations.
 */
export class PipelineDebugger {
  private steps: Array<{ label: string; duration: number; result: any }> = [];

  /**
   * Wraps a function to track its execution.
   * @template T - The type of the value in case of success.
   * @template E - The type of the error in case of failure.
   * @param {string} label - Label for this step.
   * @param {Function} fn - Function to wrap.
   * @returns {Function} - Wrapped function that tracks execution.
   */
  wrap<T, E>(
    label: string,
    fn: (input: any) => Result<T, E> | Promise<Result<T, E>>
  ) {
    return async (input: any): Promise<Result<T, E>> => {
      const start = performance.now();
      const result = await fn(input);
      const duration = performance.now() - start;

      this.steps.push({
        label,
        duration,
        result: isSuccess(result) ? { success: result.value } : { failure: result.error }
      });

      return result;
    };
  }

  /**
   * Gets the debug report.
   * @returns {Object} - Debug report with all steps and total duration.
   */
  getReport() {
    const totalDuration = this.steps.reduce((sum, step) => sum + step.duration, 0);
    
    return {
      steps: this.steps,
      totalDuration,
      averageDuration: this.steps.length > 0 ? totalDuration / this.steps.length : 0,
      slowestStep: this.steps.length > 0 
        ? this.steps.reduce((slowest, step) => 
            step.duration > slowest.duration ? step : slowest
          )
        : null
    };
  }

  /**
   * Prints the debug report.
   */
  printReport() {
    const report = this.getReport();
    
    console.log('\n=== Pipeline Debug Report ===');
    console.log(`Total duration: ${report.totalDuration.toFixed(2)}ms`);
    console.log(`Average duration: ${report.averageDuration.toFixed(2)}ms`);
    
    if (report.slowestStep) {
      console.log(`Slowest step: ${report.slowestStep.label} (${report.slowestStep.duration.toFixed(2)}ms)`);
    }
    
    console.log('\nSteps:');
    
    this.steps.forEach((step, index) => {
      console.log(`  ${index + 1}. ${step.label}: ${step.duration.toFixed(2)}ms`);
      console.log(`     Result:`, step.result);
    });
    
    console.log('========================\n');
  }

  /**
   * Clears the debug history.
   */
  clear() {
    this.steps = [];
  }
}