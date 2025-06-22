import { describe, expect, it, vi } from "vitest";
import {
  parallel,
  race,
  sequential,
  retry,
  withTimeout,
  batch,
  debounce,
} from "../lib/async";
import { success, failure, isSuccess, isFailure } from "../lib/result";

describe("Async Utilities", () => {
  describe("parallel", () => {
    it("should execute all functions in parallel and return all successes", async () => {
      const fn1 = async () => success(1);
      const fn2 = async () => success("hello");
      const fn3 = async () => success(true);
      
      const result = await parallel(fn1, fn2, fn3);
      
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toEqual([1, "hello", true]);
      }
    });

    it("should accumulate all errors", async () => {
      const fn1 = async () => success(1);
      const fn2 = async () => failure<string>("error1");
      const fn3 = async () => failure<string>("error2");
      
      const result = await parallel(fn1, fn2, fn3);
      
      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toEqual(["error1", "error2"]);
      }
    });

    it("should execute functions concurrently", async () => {
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      const fn1 = async () => { await delay(100); return success(1); };
      const fn2 = async () => { await delay(100); return success(2); };
      const fn3 = async () => { await delay(100); return success(3); };
      
      const start = Date.now();
      const result = await parallel(fn1, fn2, fn3);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(200); // Should be around 100ms, not 300ms
      expect(isSuccess(result)).toBe(true);
    });
  });

  describe("race", () => {
    it("should return the first successful result", async () => {
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      const fn1 = async () => { await delay(100); return failure<string>("error1"); };
      const fn2 = async () => { await delay(50); return success(2); };
      const fn3 = async () => { await delay(150); return success(3); };
      
      const result = await race(fn1, fn2, fn3);
      
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toBe(2);
      }
    });

    it("should return all errors if no success", async () => {
      const fn1 = async () => failure<string>("error1");
      const fn2 = async () => failure<string>("error2");
      const fn3 = async () => failure<string>("error3");
      
      const result = await race(fn1, fn2, fn3);
      
      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toEqual(["error1", "error2", "error3"]);
      }
    });
  });

  describe("sequential", () => {
    it("should execute functions sequentially and return all values", async () => {
      const results: number[] = [];
      const fn1 = async () => { results.push(1); return success(1); };
      const fn2 = async () => { results.push(2); return success(2); };
      const fn3 = async () => { results.push(3); return success(3); };
      
      const result = await sequential(fn1, fn2, fn3);
      
      expect(results).toEqual([1, 2, 3]); // Verify sequential execution
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toEqual([1, 2, 3]);
      }
    });

    it("should stop on first failure", async () => {
      const results: number[] = [];
      const fn1 = async () => { results.push(1); return success(1); };
      const fn2 = async () => { results.push(2); return failure<string>("error"); };
      const fn3 = async () => { results.push(3); return success(3); };
      
      const result = await sequential(fn1, fn2, fn3);
      
      expect(results).toEqual([1, 2]); // fn3 should not execute
      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toBe("error");
      }
    });
  });

  describe("retry", () => {
    it("should return success on first attempt", async () => {
      const fn = vi.fn().mockResolvedValue(success(42));
      
      const result = await retry(fn, { maxAttempts: 3 });
      
      expect(fn).toHaveBeenCalledTimes(1);
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toBe(42);
      }
    });

    it("should retry on failure and eventually succeed", async () => {
      const fn = vi.fn()
        .mockResolvedValueOnce(failure("error1"))
        .mockResolvedValueOnce(failure("error2"))
        .mockResolvedValueOnce(success(42));
      
      const result = await retry(fn, { maxAttempts: 3, delay: 10 });
      
      expect(fn).toHaveBeenCalledTimes(3);
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toBe(42);
      }
    });

    it("should return last error after max attempts", async () => {
      const fn = vi.fn()
        .mockResolvedValueOnce(failure("error1"))
        .mockResolvedValueOnce(failure("error2"))
        .mockResolvedValueOnce(failure("error3"));
      
      const result = await retry(fn, { maxAttempts: 3, delay: 10 });
      
      expect(fn).toHaveBeenCalledTimes(3);
      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toBe("error3");
      }
    });

    it("should call onRetry callback", async () => {
      const onRetry = vi.fn();
      const fn = vi.fn()
        .mockResolvedValueOnce(failure("error1"))
        .mockResolvedValueOnce(success(42));
      
      await retry(fn, { maxAttempts: 3, delay: 10, onRetry });
      
      expect(onRetry).toHaveBeenCalledWith(1, "error1");
    });

    it("should use exponential backoff", async () => {
      const fn = vi.fn()
        .mockResolvedValueOnce(failure("error1"))
        .mockResolvedValueOnce(failure("error2"))
        .mockResolvedValueOnce(success(42));
      
      const start = Date.now();
      await retry(fn, { 
        maxAttempts: 3, 
        delay: 10, 
        backoff: 'exponential',
        backoffFactor: 2 
      });
      const duration = Date.now() - start;
      
      // First retry: 10ms, second retry: 20ms (allowing for timing variance)
      expect(duration).toBeGreaterThanOrEqual(28);
    });
  });

  describe("withTimeout", () => {
    it("should return result if completes before timeout", async () => {
      const fn = async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return success(42);
      };
      
      const result = await withTimeout(fn, 100, "timeout");
      
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toBe(42);
      }
    });

    it("should return timeout error if exceeds timeout", async () => {
      const fn = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return success(42);
      };
      
      const result = await withTimeout(fn, 50, "timeout error");
      
      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toBe("timeout error");
      }
    });
  });

  describe("batch", () => {
    it("should execute with concurrency limit", async () => {
      let concurrent = 0;
      let maxConcurrent = 0;
      
      const createFn = (id: number) => async () => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await new Promise(resolve => setTimeout(resolve, 50));
        concurrent--;
        return success(id);
      };
      
      const fns = Array.from({ length: 10 }, (_, i) => createFn(i));
      const result = await batch(fns, 3);
      
      expect(maxConcurrent).toBeLessThanOrEqual(3);
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toHaveLength(10);
      }
    });

    it("should handle mixed results", async () => {
      const fns = [
        async () => success(1),
        async () => failure("error1"),
        async () => success(2),
        async () => failure("error2"),
      ];
      
      const result = await batch(fns, 2);
      
      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toEqual(["error1", "error2"]);
      }
    });
  });

  describe("debounce", () => {
    it("should debounce multiple calls", async () => {
      const fn = vi.fn().mockResolvedValue(success(42));
      const debounced = debounce(fn, 50);
      
      // Make multiple calls
      const p1 = debounced(1);
      const p2 = debounced(2);
      const p3 = debounced(3);
      
      // Wait for debounce to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Only the last call should have been made
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith(3);
      
      const result = await p3;
      expect(isSuccess(result)).toBe(true);
    });

    it("should reject previous promises when debounced", async () => {
      const fn = vi.fn().mockResolvedValue(success(42));
      const debounced = debounce(fn, 50);
      
      const p1 = debounced(1);
      const p2 = debounced(2);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const result1 = await p1;
      expect(isFailure(result1)).toBe(true);
      
      const result2 = await p2;
      expect(isSuccess(result2)).toBe(true);
    });
  });
});