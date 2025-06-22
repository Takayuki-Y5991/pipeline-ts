import { describe, expect, it, vi } from "vitest";
import {
  inspect,
  trace,
  log,
  breakpoint,
  assert,
  PipelineDebugger,
} from "../lib/debug";
import { success, failure } from "../lib/result";

describe("Debug Utilities", () => {
  describe("inspect", () => {
    it("should log success values", () => {
      const logger = vi.fn();
      const result = success(42);
      
      const inspected = inspect({ logger })(result);
      
      expect(logger).toHaveBeenCalledWith("Result: Success ->", 42);
      expect(inspected).toBe(result);
    });

    it("should log failure values", () => {
      const logger = vi.fn();
      const result = failure("error");
      
      const inspected = inspect({ logger })(result);
      
      expect(logger).toHaveBeenCalledWith("Result: Failure ->", "error");
      expect(inspected).toBe(result);
    });

    it("should include timestamp when requested", () => {
      const logger = vi.fn();
      const result = success(42);
      
      inspect({ logger, includeTimestamp: true })(result);
      
      expect(logger).toHaveBeenCalledWith(
        expect.stringMatching(/^\[\d{4}-\d{2}-\d{2}T.*\] Result: Success ->$/),
        42
      );
    });

    it("should log stack trace for Error failures", () => {
      const logger = vi.fn();
      const error = new Error("test error");
      const result = failure(error);
      
      inspect({ logger, includeStack: true })(result);
      
      expect(logger).toHaveBeenCalledTimes(2);
      expect(logger).toHaveBeenNthCalledWith(1, "Result: Failure ->", error);
      expect(logger).toHaveBeenNthCalledWith(2, "Stack trace:", error.stack);
    });

    it("should use custom label", () => {
      const logger = vi.fn();
      const result = success(42);
      
      inspect({ logger, label: "Custom" })(result);
      
      expect(logger).toHaveBeenCalledWith("Custom: Success ->", 42);
    });
  });

  describe("trace", () => {
    it("should measure execution time", async () => {
      const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
      const fn = vi.fn((result) => result);
      const result = success(42);
      
      const traced = await trace("test operation", fn)(result);
      
      expect(fn).toHaveBeenCalledWith(result);
      expect(traced).toBe(result);
      expect(consoleLog).toHaveBeenCalledWith(
        expect.stringMatching(/^\[Trace\] test operation: \d+\.\d+ms$/)
      );
      
      consoleLog.mockRestore();
    });

    it("should handle async functions", async () => {
      const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
      const fn = vi.fn(async (result) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return result;
      });
      const result = success(42);
      
      const traced = await trace("async operation", fn)(result);
      
      expect(traced).toBe(result);
      expect(consoleLog).toHaveBeenCalledWith(
        expect.stringMatching(/^\[Trace\] async operation: \d+\.\d+ms$/)
      );
      
      consoleLog.mockRestore();
    });
  });

  describe("log", () => {
    it("should log custom success message", () => {
      const logger = vi.fn();
      const result = success(42);
      
      const logged = log({
        onSuccess: (value) => `Got value: ${value}`,
      }, logger)(result);
      
      expect(logger).toHaveBeenCalledWith("Got value: 42");
      expect(logged).toBe(result);
    });

    it("should log custom failure message", () => {
      const logger = vi.fn();
      const result = failure("error");
      
      const logged = log({
        onFailure: (error) => `Error occurred: ${error}`,
      }, logger)(result);
      
      expect(logger).toHaveBeenCalledWith("Error occurred: error");
      expect(logged).toBe(result);
    });

    it("should not log if no message function provided", () => {
      const logger = vi.fn();
      const result = success(42);
      
      log({}, logger)(result);
      
      expect(logger).not.toHaveBeenCalled();
    });
  });

  describe("assert", () => {
    it("should pass through success that meets predicate", () => {
      const result = success(42);
      
      const asserted = assert((value: number) => value > 0, "Value must be positive")(result);
      
      expect(asserted).toBe(result);
    });

    it("should throw on success that fails predicate", () => {
      const result = success(-5);
      
      expect(() => 
        assert((value: number) => value > 0, "Value must be positive")(result)
      ).toThrow("Assertion failed: Value must be positive. Value: -5");
    });

    it("should pass through failures", () => {
      const result = failure("error");
      
      const asserted = assert((value: number) => value > 0, "Value must be positive")(result);
      
      expect(asserted).toBe(result);
    });
  });

  describe("PipelineDebugger", () => {
    it("should track pipeline steps", async () => {
      const pipelineDebugger = new PipelineDebugger();
      
      const step1 = pipelineDebugger.wrap("step1", (x: number) => success(x * 2));
      const step2 = pipelineDebugger.wrap("step2", (x: number) => success(x + 10));
      const step3 = pipelineDebugger.wrap("step3", (x: number) => failure("error"));
      
      await step1(5);
      await step2(10);
      await step3(20);
      
      const report = pipelineDebugger.getReport();
      
      expect(report.steps).toHaveLength(3);
      expect(report.steps[0].label).toBe("step1");
      expect(report.steps[0].result).toEqual({ success: 10 });
      expect(report.steps[1].label).toBe("step2");
      expect(report.steps[1].result).toEqual({ success: 20 });
      expect(report.steps[2].label).toBe("step3");
      expect(report.steps[2].result).toEqual({ failure: "error" });
    });

    it("should calculate timing statistics", async () => {
      const pipelineDebugger = new PipelineDebugger();
      
      const step1 = pipelineDebugger.wrap("fast", (x: number) => success(x));
      const step2 = pipelineDebugger.wrap("slow", async (x: number) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return success(x);
      });
      
      await step1(5);
      await step2(10);
      
      const report = pipelineDebugger.getReport();
      
      expect(report.totalDuration).toBeGreaterThanOrEqual(49);
      expect(report.averageDuration).toBeGreaterThanOrEqual(24);
      expect(report.slowestStep.label).toBe("slow");
    });

    it("should clear history", () => {
      const pipelineDebugger = new PipelineDebugger();
      
      const step = pipelineDebugger.wrap("step", (x: number) => success(x));
      step(5);
      
      pipelineDebugger.clear();
      const report = pipelineDebugger.getReport();
      
      expect(report.steps).toHaveLength(0);
    });

    it("should print formatted report", async () => {
      const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
      const pipelineDebugger = new PipelineDebugger();
      
      const step = pipelineDebugger.wrap("test", (x: number) => success(x * 2));
      await step(5);
      
      pipelineDebugger.printReport();
      
      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining("Pipeline Debug Report"));
      
      // Check if any call contains "test"
      const calls = consoleLog.mock.calls;
      const hasTestCall = calls.some(call => 
        call.some(arg => typeof arg === 'string' && arg.includes('test'))
      );
      expect(hasTestCall).toBe(true);
      
      consoleLog.mockRestore();
    });
  });
});