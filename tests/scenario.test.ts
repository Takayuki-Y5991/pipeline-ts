import { describe, expect, it } from "vitest";
import { pipe } from "../src/pipe";
import {
  chain,
  failure,
  fromPromise,
  match,
  of,
  Result,
  success,
} from "../src/result";

// 同期関数
const addOne = (x: number): Result<number, string> => success(x + 1);
const double = (x: number): Result<number, string> => success(x * 2);
const square = (x: number): Result<number, string> => success(x * x);

// 非同期関数
const asyncAddOne = async (x: number): Promise<Result<number, string>> =>
  success(x + 1);
const asyncDouble = async (x: number): Promise<Result<number, string>> =>
  success(x * 2);
const asyncSquare = async (x: number): Promise<Result<number, string>> =>
  success(x * x);
const asyncAddTen = async (x: number): Promise<Result<number, string>> =>
  success(x + 10);

// 混合型関数
const numberToString = (x: number): Result<string, string> =>
  success(`Number: ${x}`);
const asyncStringLength = async (s: string): Promise<Result<number, string>> =>
  success(s.length);

// テストケース
describe("Result Pipe Scenarios", () => {
  it("should handle a sequence of synchronous operations", async () => {
    const initial = of(2);
    const result = await pipe(
      chain(addOne),
      chain(double),
      chain(square)
    )(initial);

    expect(result).toEqual(success(36));
  });

  it("should handle a sequence of asynchronous operations", async () => {
    const initial = await fromPromise(Promise.resolve(2));
    const result = await pipe(
      chain(asyncAddOne),
      chain(asyncDouble),
      chain(asyncSquare),
      chain(asyncAddTen),
      match({
        onSuccess: (value: number) => success(value),
        onFailure: (error: string) => failure(error),
      })
    )(initial);

    expect(result).toEqual(success(90));
  });

  it("should handle a mix of synchronous and asynchronous operations", async () => {
    const initial = of(2);
    const result = await pipe(
      chain(addOne),
      chain(asyncDouble),
      chain(square),
      chain(asyncAddTen),
      match({
        onSuccess: (value: number) => success(value),
        onFailure: (error: string) => failure(error),
      })
    )(initial);

    expect(result).toEqual(success(50));
  });

  it("should handle a mix of different types in operations", async () => {
    const initial = of(2);
    const result = await pipe(
      chain(addOne),
      chain((value: number) => numberToString(value)),
      chain(asyncStringLength),
      match({
        onSuccess: (value: number) => success(value),
        onFailure: (error: string) => failure(error),
      })
    )(initial);

    expect(result).toEqual(success(9));
  });
});
