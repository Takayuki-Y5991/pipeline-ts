import { describe, expect, it, vi } from "vitest";
import {
  success,
  failure,
  map,
  mapAsync,
  flatMap,
  flatMapAsync,
  fold,
  bimap,
  tap,
  tapAsync,
  mapError,
  recover,
  recoverWith,
  orElse,
  getOrElse,
  getOrElseWith,
  filter,
  isSuccess,
  isFailure,
} from "../lib/result";

describe("Extended Result Operations", () => {
  describe("map", () => {
    it("should map over a success", () => {
      const result = success(5);
      const mapped = map((x: number) => x * 2)(result);
      expect(isSuccess(mapped)).toBe(true);
      if (isSuccess(mapped)) expect(mapped.value).toBe(10);
    });

    it("should not map over a failure", () => {
      const result = failure<string>("error");
      const mapped = map((x: number) => x * 2)(result);
      expect(isFailure(mapped)).toBe(true);
      if (isFailure(mapped)) expect(mapped.error).toBe("error");
    });
  });

  describe("mapAsync", () => {
    it("should map async function over a success", async () => {
      const result = success(5);
      const mapped = await mapAsync(async (x: number) => x * 2)(result);
      expect(isSuccess(mapped)).toBe(true);
      if (isSuccess(mapped)) expect(mapped.value).toBe(10);
    });

    it("should not map async over a failure", async () => {
      const result = failure<string>("error");
      const mapped = await mapAsync(async (x: number) => x * 2)(result);
      expect(isFailure(mapped)).toBe(true);
      if (isFailure(mapped)) expect(mapped.error).toBe("error");
    });
  });

  describe("flatMap", () => {
    it("should flatMap over a success", () => {
      const result = success(5);
      const flatMapped = flatMap((x: number) => success(x * 2))(result);
      expect(isSuccess(flatMapped)).toBe(true);
      if (isSuccess(flatMapped)) expect(flatMapped.value).toBe(10);
    });

    it("should flatMap to failure", () => {
      const result = success(5);
      const flatMapped = flatMap((x: number) => failure("error"))(result);
      expect(isFailure(flatMapped)).toBe(true);
      if (isFailure(flatMapped)) expect(flatMapped.error).toBe("error");
    });

    it("should not flatMap over a failure", () => {
      const result = failure<string>("initial error");
      const flatMapped = flatMap((x: number) => success(x * 2))(result);
      expect(isFailure(flatMapped)).toBe(true);
      if (isFailure(flatMapped)) expect(flatMapped.error).toBe("initial error");
    });
  });

  describe("flatMapAsync", () => {
    it("should flatMap async over a success", async () => {
      const result = success(5);
      const flatMapped = await flatMapAsync(async (x: number) => success(x * 2))(result);
      expect(isSuccess(flatMapped)).toBe(true);
      if (isSuccess(flatMapped)) expect(flatMapped.value).toBe(10);
    });
  });

  describe("fold", () => {
    it("should fold a success", () => {
      const result = success(5);
      const folded = fold(
        (err) => `Error: ${err}`,
        (val) => `Value: ${val}`
      )(result);
      expect(folded).toBe("Value: 5");
    });

    it("should fold a failure", () => {
      const result = failure("error");
      const folded = fold(
        (err) => `Error: ${err}`,
        (val) => `Value: ${val}`
      )(result);
      expect(folded).toBe("Error: error");
    });
  });

  describe("bimap", () => {
    it("should bimap a success", () => {
      const result = success(5);
      const bimapped = bimap(
        (val: number) => val * 2,
        (err: string) => err.toUpperCase()
      )(result);
      expect(isSuccess(bimapped)).toBe(true);
      if (isSuccess(bimapped)) expect(bimapped.value).toBe(10);
    });

    it("should bimap a failure", () => {
      const result = failure("error");
      const bimapped = bimap(
        (val: number) => val * 2,
        (err: string) => err.toUpperCase()
      )(result);
      expect(isFailure(bimapped)).toBe(true);
      if (isFailure(bimapped)) expect(bimapped.error).toBe("ERROR");
    });
  });

  describe("tap", () => {
    it("should execute side effect on success", () => {
      const sideEffect = vi.fn();
      const result = success(5);
      const tapped = tap(sideEffect)(result);
      
      expect(sideEffect).toHaveBeenCalledWith(5);
      expect(tapped).toBe(result);
    });

    it("should not execute side effect on failure", () => {
      const sideEffect = vi.fn();
      const result = failure("error");
      const tapped = tap(sideEffect)(result);
      
      expect(sideEffect).not.toHaveBeenCalled();
      expect(tapped).toBe(result);
    });
  });

  describe("tapAsync", () => {
    it("should execute async side effect on success", async () => {
      const sideEffect = vi.fn().mockResolvedValue(undefined);
      const result = success(5);
      const tapped = await tapAsync(sideEffect)(result);
      
      expect(sideEffect).toHaveBeenCalledWith(5);
      expect(tapped).toEqual(result);
    });
  });

  describe("mapError", () => {
    it("should map error on failure", () => {
      const result = failure("error");
      const mapped = mapError((err: string) => err.toUpperCase())(result);
      expect(isFailure(mapped)).toBe(true);
      if (isFailure(mapped)) expect(mapped.error).toBe("ERROR");
    });

    it("should not map error on success", () => {
      const result = success(5);
      const mapped = mapError((err: string) => err.toUpperCase())(result);
      expect(isSuccess(mapped)).toBe(true);
      if (isSuccess(mapped)) expect(mapped.value).toBe(5);
    });
  });

  describe("recover", () => {
    it("should recover from failure", () => {
      const result = failure<string>("error");
      const recovered = recover((err: string) => 42)(result);
      expect(isSuccess(recovered)).toBe(true);
      if (isSuccess(recovered)) expect(recovered.value).toBe(42);
    });

    it("should not affect success", () => {
      const result = success(5);
      const recovered = recover((err: string) => 42)(result);
      expect(isSuccess(recovered)).toBe(true);
      if (isSuccess(recovered)) expect(recovered.value).toBe(5);
    });
  });

  describe("recoverWith", () => {
    it("should recover with new Result from failure", () => {
      const result = failure<string>("error");
      const recovered = recoverWith((err: string) => success(42))(result);
      expect(isSuccess(recovered)).toBe(true);
      if (isSuccess(recovered)) expect(recovered.value).toBe(42);
    });

    it("should recover with failure", () => {
      const result = failure<string>("error");
      const recovered = recoverWith((err: string) => failure<number>(404))(result);
      expect(isFailure(recovered)).toBe(true);
      if (isFailure(recovered)) expect(recovered.error).toBe(404);
    });
  });

  describe("orElse", () => {
    it("should return alternative on failure", () => {
      const result = failure<string>("error");
      const alternative = orElse(() => success(42))(result);
      expect(isSuccess(alternative)).toBe(true);
      if (isSuccess(alternative)) expect(alternative.value).toBe(42);
    });

    it("should return original on success", () => {
      const result = success(5);
      const alternative = orElse(() => success(42))(result);
      expect(isSuccess(alternative)).toBe(true);
      if (isSuccess(alternative)) expect(alternative.value).toBe(5);
    });
  });

  describe("getOrElse", () => {
    it("should return value on success", () => {
      const result = success(5);
      const value = getOrElse(42)(result);
      expect(value).toBe(5);
    });

    it("should return default on failure", () => {
      const result = failure("error");
      const value = getOrElse(42)(result);
      expect(value).toBe(42);
    });
  });

  describe("getOrElseWith", () => {
    it("should return value on success", () => {
      const result = success(5);
      const value = getOrElseWith((err: string) => 42)(result);
      expect(value).toBe(5);
    });

    it("should compute value from error on failure", () => {
      const result = failure("error");
      const value = getOrElseWith((err: string) => err.length)(result);
      expect(value).toBe(5);
    });
  });

  describe("filter", () => {
    it("should keep success when predicate is true", () => {
      const result = success(5);
      const filtered = filter(
        (x: number) => x > 0,
        (x: number) => `${x} is not positive`
      )(result);
      expect(isSuccess(filtered)).toBe(true);
      if (isSuccess(filtered)) expect(filtered.value).toBe(5);
    });

    it("should convert to failure when predicate is false", () => {
      const result = success(-5);
      const filtered = filter(
        (x: number) => x > 0,
        (x: number) => `${x} is not positive`
      )(result);
      expect(isFailure(filtered)).toBe(true);
      if (isFailure(filtered)) expect(filtered.error).toBe("-5 is not positive");
    });

    it("should not affect failure", () => {
      const result = failure<string>("error");
      const filtered = filter(
        (x: number) => x > 0,
        (x: number) => `${x} is not positive`
      )(result);
      expect(isFailure(filtered)).toBe(true);
      if (isFailure(filtered)) expect(filtered.error).toBe("error");
    });
  });
});