import { describe, expect, it } from "vitest";
import { pipe } from "../src/pipe";
import { failure, isFailure, isSuccess, Result, success } from "../src/result";

// ユーティリティ関数の定義
const double = (value: number): Result<number, Error> => success(value * 2);
const square = (value: number): Result<number, Error> => success(value * value);
const throwError = (): Result<number, Error> => failure(new Error("Error"));
const asyncDouble = async (value: number): Promise<Result<number, Error>> =>
  success(value * 2);
const asyncSquare = async (value: number): Promise<Result<number, Error>> =>
  success(value * value);
const asyncThrowError = async (): Promise<Result<number, Error>> =>
  failure(new Error("Error"));

// テストケースの定義
describe("pipe", () => {
  it("should apply a sequence of functions to a success result", async () => {
    const fn = pipe(double, square);
    const result = await fn(10);
    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.value).toBe(400);
    }
  });

  it("should return a failure result if any function throws an error", async () => {
    const fn = pipe(double, throwError);
    const result = await fn(10);
    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error.message).toBe("Error");
    }
  });

  it("should handle asynchronous functions", async () => {
    const fn = pipe(asyncDouble, asyncSquare);
    const result = await fn(10);
    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.value).toBe(400);
    }
  });

  it("should return a failure result if any asynchronous function throws an error", async () => {
    const fn = pipe(asyncDouble, asyncThrowError);
    const result = await fn(10);
    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error.message).toBe("Error");
    }
  });
});
