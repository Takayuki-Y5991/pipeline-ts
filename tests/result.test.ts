import { describe, expect, it } from "vitest";
import {
  failure,
  fromPromise,
  isFailure,
  isSuccess,
  match,
  success,
} from "../lib/result";

describe("Result Type Functions", () => {
  it("should create a success result", () => {
    const result = success(42);
    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) expect(result.value).toBe(42);
  });

  it("should create a failure result", () => {
    const result = failure("Error occurred");
    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) expect(result.error).toBe("Error occurred");
  });

  it("should match a success result", async () => {
    const result = success(42);
    const matched = await match({
      onSuccess: (value) => `Success: ${value}`,
      onFailure: (error) => `Failure: ${error}`,
    })(result);
    expect(matched).toBe("Success: 42");
  });

  it("should match a failure result", async () => {
    const result = failure("Error occurred");
    const matched = await match({
      onSuccess: (value) => `Success: ${value}`,
      onFailure: (error) => `Failure: ${error}`,
    })(result);
    expect(matched).toBe("Failure: Error occurred");
  });

  it("should create a result from a resolved promise", async () => {
    const promise = Promise.resolve(42);
    const result = await fromPromise(promise);
    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) expect(result.value).toBe(42);
  });

  it("should create a result from a rejected promise", async () => {
    const promise = Promise.reject(new Error("Error occurred"));
    const result = await fromPromise(promise);
    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) expect(result.error.message).toBe("Error occurred");
  });

  it("should handle a promise with match function", async () => {
    const promise = Promise.resolve(42);
    const result = await fromPromise(promise);
    const matched = await match({
      onSuccess: (value) => `Resolved: ${value}`,
      onFailure: (error: Error) => `Rejected: ${error.message}`,
    })(result);
    expect(matched).toBe("Resolved: 42");
  });

  it("should handle a rejected promise with match function", async () => {
    const promise = Promise.reject(new Error("Error occurred"));
    const result = await fromPromise(promise);
    const matched = await match({
      onSuccess: (value) => `Resolved: ${value}`,
      onFailure: (error: Error) => `Rejected: ${error.message}`,
    })(result);
    expect(matched).toBe("Rejected: Error occurred");
  });
});
