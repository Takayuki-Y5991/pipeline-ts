/**
 * Represents a successful result.
 * @template T - The type of the value.
 */
export class Success<T> {
  readonly isSuccess = true;
  readonly isFailure = false;
  /**
   * Creates an instance of Success.
   * @param {T} value - The value of the successful result.
   */
  constructor(public readonly value: T) {}
}

/**
 * Represents a failed result.
 * @template E - The type of the error.
 */
export class Failure<E> {
  readonly isSuccess = false;
  readonly isFailure = true;
  /**
   * Creates an instance of Failure.
   * @param {E} error - The error of the failed result.
   */
  constructor(public readonly error: E) {}
}

/**
 * Type alias for a result which can be either a Success or a Failure.
 * @template T - The type of the value in case of success.
 * @template E - The type of the error in case of failure.
 */
export type Result<T, E> = Success<T> | Failure<E>;

/**
 * Type alias for an asynchronous result.
 * @template T - The type of the value in case of success.
 * @template E - The type of the error in case of failure.
 */
export type AsyncResult<T, E> = Result<T, E> | Promise<Result<T, E>>;

/**
 * Checks if the given result is a Success.
 * @template T - The type of the value in case of success.
 * @template E - The type of the error in case of failure.
 * @param {Result<T, E>} result - The result to check.
 * @returns {result is Success<T>} - True if the result is a Success, otherwise false.
 */
export const isSuccess = <T, E>(result: Result<T, E>): result is Success<T> =>
  result.isSuccess;

/**
 * Checks if the given result is a Failure.
 * @template T - The type of the value in case of success.
 * @template E - The type of the error in case of failure.
 * @param {Result<T, E>} result - The result to check.
 * @returns {result is Failure<E>} - True if the result is a Failure, otherwise false.
 */
export const isFailure = <T, E>(result: Result<T, E>): result is Failure<E> =>
  result.isFailure;

/**
 * Creates a success result.
 * @template T - The type of the value.
 * @param {T} value - The value of the success result.
 * @returns {Result<T, never>} - The success result.
 */
export const success = <T>(value: T): Result<T, never> => new Success(value);

/**
 * Creates a failure result.
 * @template E - The type of the error.
 * @param {E} error - The error of the failure result.
 * @returns {Result<never, E>} - The failure result.
 */
export const failure = <E>(error: E): Result<never, E> => new Failure(error);

/**
 * Wraps a value in a success result.
 * @template T - The type of the value.
 * @param {T} value - The value to wrap.
 * @returns {Result<T, never>} - The success result.
 */
export const of = <T>(value: T): Result<T, never> => success(value);

/**
 * Matches a result to a function based on whether it is a success or a failure.
 * @template T - The type of the value in case of success.
 * @template E - The type of the error in case of failure.
 * @template RS - The return type of the success handler.
 * @template RF - The return type of the failure handler.
 * @param {Object} handlers - An object containing the success and failure handlers.
 * @param {(value: T) => RS | Promise<RS>} handlers.onSuccess - The success handler.
 * @param {(error: E) => RF | Promise<RF>} handlers.onFailure - The failure handler.
 * @returns {(result: Result<T, E>) => Promise<RS | RF>} - A function that takes a result and returns a promise that resolves to the result of the appropriate handler.
 */
export const match =
  <T, E, RS, RF>({
    onSuccess,
    onFailure,
  }: {
    onSuccess: (value: T) => RS | Promise<RS>;
    onFailure: (error: E) => RF | Promise<RF>;
  }) =>
  async (result: Result<T, E>): Promise<RS | RF> =>
    isSuccess(result) ? onSuccess(result.value) : onFailure(result.error);

/**
 * Converts a promise to a result.
 * @template T - The type of the value in case of success.
 * @template E - The type of the error in case of failure.
 * @param {Promise<T>} promise - The promise to convert.
 * @returns {Promise<Result<T, E>>} - A promise that resolves to a result.
 */
export const fromPromise = async <T, E extends Error = Error>(
  promise: Promise<T>
): Promise<Result<T, E>> => {
  try {
    const value = await promise;
    return success(value);
  } catch (error) {
    return failure(error as E);
  }
};
