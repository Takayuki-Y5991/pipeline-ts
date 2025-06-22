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

/**
 * Maps a function over a successful result.
 * @template T - The type of the value in case of success.
 * @template U - The type of the mapped value.
 * @template E - The type of the error in case of failure.
 * @param {(value: T) => U} fn - The mapping function.
 * @returns {(result: Result<T, E>) => Result<U, E>} - A function that takes a result and returns a mapped result.
 */
export const map =
  <T, U, E>(fn: (value: T) => U) =>
  (result: Result<T, E>): Result<U, E> =>
    isSuccess(result) ? success(fn(result.value)) : result;

/**
 * Maps an async function over a successful result.
 * @template T - The type of the value in case of success.
 * @template U - The type of the mapped value.
 * @template E - The type of the error in case of failure.
 * @param {(value: T) => Promise<U>} fn - The async mapping function.
 * @returns {(result: Result<T, E>) => Promise<Result<U, E>>} - A function that takes a result and returns a promise of mapped result.
 */
export const mapAsync =
  <T, U, E>(fn: (value: T) => Promise<U>) =>
  async (result: Result<T, E>): Promise<Result<U, E>> =>
    isSuccess(result) ? success(await fn(result.value)) : result;

/**
 * FlatMaps a function over a successful result.
 * @template T - The type of the value in case of success.
 * @template U - The type of the mapped value.
 * @template E - The type of the error in case of failure.
 * @param {(value: T) => Result<U, E>} fn - The flat mapping function.
 * @returns {(result: Result<T, E>) => Result<U, E>} - A function that takes a result and returns a flat mapped result.
 */
export const flatMap =
  <T, U, E>(fn: (value: T) => Result<U, E>) =>
  (result: Result<T, E>): Result<U, E> =>
    isSuccess(result) ? fn(result.value) : result;

/**
 * FlatMaps an async function over a successful result.
 * @template T - The type of the value in case of success.
 * @template U - The type of the mapped value.
 * @template E - The type of the error in case of failure.
 * @param {(value: T) => Promise<Result<U, E>>} fn - The async flat mapping function.
 * @returns {(result: Result<T, E>) => Promise<Result<U, E>>} - A function that takes a result and returns a promise of flat mapped result.
 */
export const flatMapAsync =
  <T, U, E>(fn: (value: T) => Promise<Result<U, E>>) =>
  async (result: Result<T, E>): Promise<Result<U, E>> =>
    isSuccess(result) ? fn(result.value) : result;

/**
 * Folds a result into a single value.
 * @template T - The type of the value in case of success.
 * @template E - The type of the error in case of failure.
 * @template U - The type of the folded value.
 * @param {(error: E) => U} onFailure - The failure handler.
 * @param {(value: T) => U} onSuccess - The success handler.
 * @returns {(result: Result<T, E>) => U} - A function that takes a result and returns a folded value.
 */
export const fold =
  <T, E, U>(onFailure: (error: E) => U, onSuccess: (value: T) => U) =>
  (result: Result<T, E>): U =>
    isSuccess(result) ? onSuccess(result.value) : onFailure(result.error);

/**
 * Maps both success and failure cases.
 * @template T - The type of the value in case of success.
 * @template U - The type of the mapped success value.
 * @template E - The type of the error in case of failure.
 * @template F - The type of the mapped error.
 * @param {(value: T) => U} onSuccess - The success mapping function.
 * @param {(error: E) => F} onFailure - The failure mapping function.
 * @returns {(result: Result<T, E>) => Result<U, F>} - A function that takes a result and returns a bi-mapped result.
 */
export const bimap =
  <T, U, E, F>(onSuccess: (value: T) => U, onFailure: (error: E) => F) =>
  (result: Result<T, E>): Result<U, F> =>
    isSuccess(result)
      ? success(onSuccess(result.value))
      : failure(onFailure(result.error));

/**
 * Executes a side effect on a successful result.
 * @template T - The type of the value in case of success.
 * @template E - The type of the error in case of failure.
 * @param {(value: T) => void} fn - The side effect function.
 * @returns {(result: Result<T, E>) => Result<T, E>} - A function that takes a result and returns the same result.
 */
export const tap =
  <T, E>(fn: (value: T) => void) =>
  (result: Result<T, E>): Result<T, E> => {
    if (isSuccess(result)) fn(result.value);
    return result;
  };

/**
 * Executes an async side effect on a successful result.
 * @template T - The type of the value in case of success.
 * @template E - The type of the error in case of failure.
 * @param {(value: T) => Promise<void>} fn - The async side effect function.
 * @returns {(result: Result<T, E>) => Promise<Result<T, E>>} - A function that takes a result and returns a promise of the same result.
 */
export const tapAsync =
  <T, E>(fn: (value: T) => Promise<void>) =>
  async (result: Result<T, E>): Promise<Result<T, E>> => {
    if (isSuccess(result)) await fn(result.value);
    return result;
  };

/**
 * Maps a function over a failure result.
 * @template T - The type of the value in case of success.
 * @template E - The type of the error in case of failure.
 * @template F - The type of the mapped error.
 * @param {(error: E) => F} fn - The error mapping function.
 * @returns {(result: Result<T, E>) => Result<T, F>} - A function that takes a result and returns a mapped result.
 */
export const mapError =
  <T, E, F>(fn: (error: E) => F) =>
  (result: Result<T, E>): Result<T, F> =>
    isFailure(result) ? failure(fn(result.error)) : result;

/**
 * Recovers from a failure by converting it to a success.
 * @template T - The type of the value in case of success.
 * @template E - The type of the error in case of failure.
 * @param {(error: E) => T} fn - The recovery function.
 * @returns {(result: Result<T, E>) => Result<T, never>} - A function that takes a result and returns a recovered result.
 */
export const recover =
  <T, E>(fn: (error: E) => T) =>
  (result: Result<T, E>): Result<T, never> =>
    isFailure(result) ? success(fn(result.error)) : result;

/**
 * Recovers from a failure with a Result.
 * @template T - The type of the value in case of success.
 * @template E - The type of the error in case of failure.
 * @template F - The type of the new error.
 * @param {(error: E) => Result<T, F>} fn - The recovery function.
 * @returns {(result: Result<T, E>) => Result<T, F>} - A function that takes a result and returns a recovered result.
 */
export const recoverWith =
  <T, E, F>(fn: (error: E) => Result<T, F>) =>
  (result: Result<T, E>): Result<T, F> =>
    isFailure(result) ? fn(result.error) : result;

/**
 * Returns an alternative result if the current one is a failure.
 * @template T - The type of the value in case of success.
 * @template E - The type of the error in case of failure.
 * @param {() => Result<T, E>} fn - Function that returns an alternative result.
 * @returns {(result: Result<T, E>) => Result<T, E>} - A function that takes a result and returns either the original or alternative result.
 */
export const orElse =
  <T, E>(fn: () => Result<T, E>) =>
  (result: Result<T, E>): Result<T, E> =>
    isFailure(result) ? fn() : result;

/**
 * Returns a default value if the result is a failure.
 * @template T - The type of the value in case of success.
 * @template E - The type of the error in case of failure.
 * @param {T} defaultValue - The default value.
 * @returns {(result: Result<T, E>) => T} - A function that takes a result and returns either the success value or default.
 */
export const getOrElse =
  <T, E>(defaultValue: T) =>
  (result: Result<T, E>): T =>
    isSuccess(result) ? result.value : defaultValue;

/**
 * Returns a value computed from the error if the result is a failure.
 * @template T - The type of the value in case of success.
 * @template E - The type of the error in case of failure.
 * @param {(error: E) => T} fn - Function to compute value from error.
 * @returns {(result: Result<T, E>) => T} - A function that takes a result and returns either the success value or computed value.
 */
export const getOrElseWith =
  <T, E>(fn: (error: E) => T) =>
  (result: Result<T, E>): T =>
    isSuccess(result) ? result.value : fn(result.error);

/**
 * Filters a success value based on a predicate.
 * @template T - The type of the value in case of success.
 * @template E - The type of the error in case of failure.
 * @param {(value: T) => boolean} predicate - The predicate function.
 * @param {(value: T) => E} onFalse - Function to create error when predicate fails.
 * @returns {(result: Result<T, E>) => Result<T, E>} - A function that takes a result and returns a filtered result.
 */
export const filter =
  <T, E>(predicate: (value: T) => boolean, onFalse: (value: T) => E) =>
  (result: Result<T, E>): Result<T, E> =>
    isSuccess(result)
      ? predicate(result.value)
        ? result
        : failure(onFalse(result.value))
      : result;
