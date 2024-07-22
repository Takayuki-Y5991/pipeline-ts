# PipeLineTS

PipeLineTS is a minimal dependency-free library for composing pipelines in TypeScript. It allows you to compose both synchronous and asynchronous functions, ensuring type safety throughout the pipeline.

## Features

- Type-safe function composition
- Supports both synchronous and asynchronous functions
- Handles success and failure cases with a unified `Result` type

## Installation

You can install this package using pnpm:
```sh
pnpm add ts-dependency-free-pipeline
```

## Usage
Define Result Types and Utility Functions

Create a file named `result.ts` with the following content:

```typescript

export class Success<T> {
  readonly isSuccess = true;
  readonly isFailure = false;

  constructor(public readonly value: T) {}
}

export class Failure<E> {
  readonly isSuccess = false;
  readonly isFailure = true;

  constructor(public readonly error: E) {}
}

export type Result<T, E> = Success<T> | Failure<E>;
export type AsyncResult<T, E> = Result<T, E> | Promise<Result<T, E>>;

export const isSuccess = <T, E>(result: Result<T, E>): result is Success<T> =>
  result.isSuccess;
export const isFailure = <T, E>(result: Result<T, E>): result is Failure<E> =>
  result.isFailure;

export const success = <T>(value: T): Result<T, never> => new Success(value);
export const failure = <E>(error: E): Result<never, E> => new Failure(error);

export const of = <T>(value: T): Result<T, never> => success(value);

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
```

## Define pipe Function

Create a file named pipeline.ts with the following content:

```typescript

import { AsyncResult, isFailure, Result, Success } from "./result";

type Last<T extends any[]> = T extends [...infer _, infer L] ? L : never;
type PipeFn<In, Out, E> = (arg: In) => AsyncResult<Out, E>;
type LastReturnType<T extends any[], K> = K extends keyof T
  ? T[K] extends PipeFn<any, infer S, any>
    ? S
    : never
  : never;
type ExtractError<T extends any[]> = T[number] extends PipeFn<any, any, infer E>
  ? E
  : never;

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
```
## Example Usage

```typescript

import { pipe } from './pipeline';
import { success, failure, match, Result } from './result';

// Define your functions
const parseNumber = async (input: string): Promise<Result<number, string>> =>
  isNaN(Number(input)) ? failure("Not a number") : success(Number(input));

const increment = async (num: number): Promise<Result<number, string>> =>
  success(num + 1);

const stringify = async (num: number): Promise<Result<string, string>> =>
  success(num.toString());

// Create a pipeline
const pipeline = pipe(parseNumber, increment, stringify);

// Execute the pipeline
pipeline("42").then(result =>
  match({
    onSuccess: val => console.log("Success:", val),
    onFailure: err => console.log("Error:", err)
  })(result)
);
```

## License

This project is licensed under the MIT License