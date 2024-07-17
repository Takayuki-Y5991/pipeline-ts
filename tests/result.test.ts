import { describe, expect, it } from "vitest";
import {
  chain,
  failure,
  isFailure,
  isSuccess,
  map,
  match,
  success,
} from "../src/result";

describe("Result", () => {
  it("should create a Success result", () => {
    const result = success(42);
    expect(result.isSuccess).toBe(true);
    expect(result.isFailure).toBe(false);
    if (isSuccess(result)) expect(result.value).toBe(42);
  });

  it("should create a Failure result", () => {
    const result = failure("error");
    expect(result.isSuccess).toBe(false);
    expect(result.isFailure).toBe(true);
    if (isFailure(result)) expect(result.error).toBe("error");
  });

  it("should map over a Success result", async () => {
    const result = await map((x: number) => x + 1)(success(42));
    expect(result.isSuccess).toBe(true);
    if (isSuccess(result)) expect(result.value).toBe(43);
  });

  it("should not map over a Failure result", async () => {
    const result = await map((x: number) => x + 1)(failure("error"));
    expect(result.isFailure).toBe(true);
    if (isFailure(result)) expect(result.error).toBe("error");
  });

  it("should chain over a Success result", async () => {
    const result = await chain((x: number) => Promise.resolve(success(x + 1)))(
      success(42)
    );
    if (isSuccess(result)) {
      expect(result.value).toBe(43);
    }
  });

  it("should match on a Success result", async () => {
    const result = await match({
      onSuccess: (x: number) => x + 1,
      onFailure: (err: string) => err,
    })(success(42));
    expect(result).toBe(43);
  });

  it("should match on a Failure result", async () => {
    const result = await match({
      onSuccess: (x: number) => x + 1,
      onFailure: (err: string) => err,
    })(failure("error"));
    expect(result).toBe("error");
  });
});
