import { AsyncResult, isFailure, Result, Success } from "./result";

/**
 * Type for a function that takes an input of type `In` and returns an `AsyncResult` of type `Out` and `E`.
 * @template In - The input type.
 * @template Out - The output type.
 * @template E - The error type.
 */
type PipeFn<In, Out, E> = (arg: In) => AsyncResult<Out, E>;

/**
 * Type to extract the return type of the last function in a tuple of functions.
 * @template T - The tuple of functions.
 * @template K - The index of the function in the tuple.
 */
type LastReturnType<T extends any[], K> = K extends keyof T
  ? T[K] extends PipeFn<any, infer S, any>
    ? S
    : never
  : never;

/**
 * Type to extract the error type from a tuple of functions.
 * @template T - The tuple of functions.
 */
type ExtractError<T extends any[]> = T[number] extends PipeFn<any, any, infer E>
  ? E
  : never;

/**
 * Type for a pipeline of functions, ensuring correct type inference for each function in the tuple.
 * @template T - The tuple of functions.
 * @template E - The error type.
 */
type Pipeline<T extends any[], E> = {
  [K in keyof T]: K extends "0"
    ? T[K] extends PipeFn<infer R, infer S, E>
      ? PipeFn<R, S, E>
      : never
    : T[K] extends PipeFn<infer R, infer S, E>
    ? PipeFn<LastReturnType<T, K>, S, E>
    : never;
};

/**
 * The `pipe` function composes multiple functions, handling both synchronous and asynchronous processes.
 * @template T - The tuple of functions.
 * @template ExtractError<T> - The error type extracted from the tuple of functions.
 * @param {...Pipeline<T, ExtractError<T>>} fns - The functions to compose.
 * @returns {Function} A function that takes the input of the first function and returns a `Promise` resolving to a `Result` of the last function's output type and the error type.
 *
 * @example
 * const pipeline = pipe(
 *   async (input: string) => success(parseInt(input)),
 *   async (num: number) => success(num + 1),
 *   async (num: number) => success(num.toString())
 * );
 *
 * pipeline("42").then(result =>
 *   match({
 *     onSuccess: val => console.log("Success:", val),
 *     onFailure: err => console.log("Error:", err)
 *   })(result)
 * );
 */
export const pipe = <
  T extends [PipeFn<any, any, any>, ...PipeFn<any, any, any>[]]
>(
  ...fns: Pipeline<T, ExtractError<T>>
): ((
  arg: Parameters<T[0]>[0]
) => Promise<
  Result<LastReturnType<T, keyof T & (keyof T)[]["length"]>, ExtractError<T>>
>) => {
  return async (
    arg: Parameters<T[0]>[0]
  ): Promise<
    Result<LastReturnType<T, keyof T & (keyof T)[]["length"]>, ExtractError<T>>
  > => {
    let result: Result<any, ExtractError<T>> = await fns[0](arg);
    for (const fn of fns.slice(1)) {
      if (isFailure(result)) break;
      result = await fn((result as Success<any>).value);
    }
    return result;
  };
};
