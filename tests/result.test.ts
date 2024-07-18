import { describe, expect, it } from "vitest";
import {
  bimap,
  chain,
  failure,
  fromPromise,
  isFailure,
  isSuccess,
  map,
  mapError,
  match,
  success,
} from "../src/result";

describe("Result", () => {
  describe("success", () => {
    it("should create a success result", () => {
      const result = success(10);
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) expect(result.value).toBe(10);
    });
  });

  describe("failure", () => {
    it("should create a failure result", () => {
      const result = failure("Error");
      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) expect(result.error).toBe("Error");
    });
  });

  describe("map", () => {
    it("should map a success result", async () => {
      const result = await map((value: number) => value * 2)(success(10));
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) expect(result.value).toBe(20);
    });

    it("should not map a failure result", async () => {
      const result = await map((value: number) => value * 2)(failure("Error"));
      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) expect(result.error).toBe("Error");
    });
  });

  describe("chain", () => {
    it("should chain a success result", async () => {
      const result = await chain((value: number) =>
        Promise.resolve(success(value * 2))
      )(success(10));
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) expect(result.value).toBe(20);
    });

    it("should not chain a failure result", async () => {
      const result = await chain((value: number) =>
        Promise.resolve(success(value * 2))
      )(failure("Error" as never));
      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) expect(result.error).toBe("Error");
    });
  });

  describe("bimap", () => {
    it("should bimap a success result", async () => {
      const result = await bimap(
        (value: number) => value * 2,
        (error) => "Mapped Error"
      )(success(10));
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) expect(result.value).toBe(20);
    });

    it("should bimap a failure result", async () => {
      const result = await bimap(
        (value: number) => value * 2,
        (error) => "Mapped Error"
      )(failure("Error"));
      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) expect(result.error).toBe("Mapped Error");
    });
  });

  describe("mapError", () => {
    it("should not map a success result", async () => {
      const result = await mapError((error) => "Mapped Error")(success(10));
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) expect(result.value).toBe(10);
    });

    it("should map a failure result", async () => {
      const result = await mapError((error) => "Mapped Error")(
        failure("Error")
      );
      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) expect(result.error).toBe("Mapped Error");
    });
  });

  describe("match", () => {
    it("should match a success result", async () => {
      const result = await match({
        onSuccess: (value: number) => value * 2,
        onFailure: (error) => "Mapped Error",
      })(success(10));
      expect(result).toBe(20);
    });

    it("should match a failure result", async () => {
      const result = await match({
        onSuccess: (value: number) => value * 2,
        onFailure: (error) => "Mapped Error",
      })(failure("Error"));
      expect(result).toBe("Mapped Error");
    });
  });

  describe("fromPromise", () => {
    it("should create a success result from a resolved promise", async () => {
      const result = await fromPromise(Promise.resolve(10));
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) expect(result.value).toBe(10);
    });

    it("should create a failure result from a rejected promise", async () => {
      const result = await fromPromise(Promise.reject("Error"));
      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) expect(result.error).toBe("Error");
    });
  });
});
