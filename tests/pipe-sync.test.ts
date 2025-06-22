import { describe, expect, it } from "vitest";
import { pipeSync, lazyPipe } from "../lib/pipe-sync";
import { success, failure, isSuccess, isFailure } from "../lib/result";

describe("Sync Pipe", () => {
  describe("pipeSync", () => {
    it("should compose synchronous functions", () => {
      const pipeline = pipeSync(
        (x: number) => success(x * 2),
        (x: number) => success(x + 10),
        (x: number) => success(x.toString())
      );
      
      const result = pipeline(5);
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toBe("20");
      }
    });

    it("should handle failures", () => {
      const pipeline = pipeSync(
        (x: number) => success(x * 2),
        (x: number) => x > 5 ? failure("too large") : success(x),
        (x: number) => success(x + 10)
      );
      
      const result = pipeline(5);
      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toBe("too large");
      }
    });

    it("should short-circuit on failure", () => {
      let called = false;
      const pipeline = pipeSync(
        (x: number) => success(x * 2),
        (x: number) => failure("error"),
        (x: number) => {
          called = true;
          return success(x + 10);
        }
      );
      
      const result = pipeline(5);
      expect(isFailure(result)).toBe(true);
      expect(called).toBe(false);
    });

    it("should handle single function", () => {
      const pipeline = pipeSync(
        (x: number) => success(x * 2)
      );
      
      const result = pipeline(5);
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toBe(10);
      }
    });

    it("should maintain type safety", () => {
      const pipeline = pipeSync(
        (x: string) => success(parseInt(x)),
        (x: number) => success(x * 2),
        (x: number) => success(x > 10),
        (x: boolean) => success(x ? "yes" : "no")
      );
      
      const result = pipeline("10");
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toBe("yes");
      }
    });
  });

  describe("lazyPipe", () => {
    it("should create a lazy pipeline", () => {
      const lazy = lazyPipe(
        (x: number) => success(x * 2),
        (x: number) => success(x + 10)
      );
      
      const result = lazy.run(5);
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toBe(20);
      }
    });

    it("should support map on lazy pipeline", () => {
      const lazy = lazyPipe(
        (x: number) => success(x * 2)
      ).map((x: number) => success(x.toString()));
      
      const result = lazy.run(5);
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toBe("10");
      }
    });

    it("should support flatMap on lazy pipeline", () => {
      const lazy = lazyPipe(
        (x: number) => success(x * 2)
      ).flatMap((x: number) => 
        x > 5 ? success(x.toString()) : failure("too small")
      );
      
      const result1 = lazy.run(5);
      expect(isSuccess(result1)).toBe(true);
      if (isSuccess(result1)) {
        expect(result1.value).toBe("10");
      }
      
      const result2 = lazy.run(2);
      expect(isFailure(result2)).toBe(true);
      if (isFailure(result2)) {
        expect(result2.error).toBe("too small");
      }
    });

    it("should chain multiple operations", () => {
      const lazy = lazyPipe((x: number) => success(x))
        .map((x: number) => success(x * 2))
        .map((x: number) => success(x + 10))
        .flatMap((x: number) => 
          x > 20 ? success(x.toString()) : failure("too small")
        );
      
      const result = lazy.run(10);
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toBe("30");
      }
    });
  });
});