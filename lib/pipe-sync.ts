import { Result, isFailure, Success } from "./result";

/**
 * Type for a synchronous function that takes an input of type `In` and returns a `Result` of type `Out` and `E`.
 * @template In - The input type.
 * @template Out - The output type.
 * @template E - The error type.
 */
type SyncPipeFn<In, Out, E> = (arg: In) => Result<Out, E>;

/**
 * Type to extract the return type of the last function in a tuple of functions.
 * @template T - The tuple of functions.
 * @template K - The index of the function in the tuple.
 */
type LastReturnType<T extends any[], K> = K extends keyof T
  ? T[K] extends SyncPipeFn<any, infer S, any>
    ? S
    : never
  : never;

/**
 * Type to extract the error type from a tuple of functions.
 * @template T - The tuple of functions.
 */
type ExtractError<T extends any[]> = T[number] extends SyncPipeFn<any, any, infer E>
  ? E
  : never;

/**
 * Type for a pipeline of synchronous functions, ensuring correct type inference for each function in the tuple.
 * @template T - The tuple of functions.
 * @template E - The error type.
 */
type SyncPipeline<T extends any[], E> = {
  [K in keyof T]: K extends "0"
    ? T[K] extends SyncPipeFn<infer R, infer S, E>
      ? SyncPipeFn<R, S, E>
      : never
    : T[K] extends SyncPipeFn<infer R, infer S, E>
    ? SyncPipeFn<LastReturnType<T, K>, S, E>
    : never;
};

/**
 * The `pipeSync` function composes multiple synchronous functions.
 * @template T - The tuple of functions.
 * @template ExtractError<T> - The error type extracted from the tuple of functions.
 * @param {...SyncPipeline<T, ExtractError<T>>} fns - The functions to compose.
 * @returns {Function} A function that takes the input of the first function and returns a `Result` of the last function's output type and the error type.
 *
 * @example
 * const pipeline = pipeSync(
 *   (input: string) => success(parseInt(input)),
 *   (num: number) => success(num + 1),
 *   (num: number) => success(num.toString())
 * );
 *
 * const result = pipeline("42");
 * fold(
 *   (err) => console.log("Error:", err),
 *   (val) => console.log("Success:", val)
 * )(result);
 */
export const pipeSync = <
  T extends [SyncPipeFn<any, any, any>, ...SyncPipeFn<any, any, any>[]]
>(
  ...fns: SyncPipeline<T, ExtractError<T>>
): ((
  arg: Parameters<T[0]>[0]
) => Result<LastReturnType<T, keyof T & (keyof T)[]["length"]>, ExtractError<T>>) => {
  return (
    arg: Parameters<T[0]>[0]
  ): Result<LastReturnType<T, keyof T & (keyof T)[]["length"]>, ExtractError<T>> => {
    let result: Result<any, ExtractError<T>> = fns[0](arg);
    for (const fn of fns.slice(1)) {
      if (isFailure(result)) break;
      result = fn((result as Success<any>).value);
    }
    return result;
  };
};

/**
 * Creates a lazy pipeline that only executes when called.
 * @template T - The tuple of functions.
 * @template ExtractError<T> - The error type extracted from the tuple of functions.
 * @param {...SyncPipeline<T, ExtractError<T>>} fns - The functions to compose.
 * @returns {Object} An object with `run` method to execute the pipeline.
 */
export const lazyPipe = (
  ...fns: SyncPipeFn<any, any, any>[]
) => {
  return {
    run: (arg: any) => {
      let result = fns[0](arg);
      for (let i = 1; i < fns.length; i++) {
        if (isFailure(result)) break;
        result = fns[i]((result as Success<any>).value);
      }
      return result;
    },
    map: (fn: SyncPipeFn<any, any, any>) => 
      lazyPipe(...fns, fn),
    flatMap: (fn: SyncPipeFn<any, any, any>) =>
      lazyPipe(...fns, fn)
  };
};