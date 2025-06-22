import { describe, expect, it } from "vitest";
import {
  valid,
  invalid,
  combine,
  validateObject,
  sequence,
  mapValidation,
  applyValidation,
  fromResult,
  toResult,
} from "../lib/validation";
import { success, failure, isSuccess, isFailure } from "../lib/result";

describe("Validation", () => {
  describe("valid and invalid", () => {
    it("should create a valid result", () => {
      const validation = valid(42);
      expect(isSuccess(validation)).toBe(true);
      if (isSuccess(validation)) expect(validation.value).toBe(42);
    });

    it("should create an invalid result with single error", () => {
      const validation = invalid("error");
      expect(isFailure(validation)).toBe(true);
      if (isFailure(validation)) expect(validation.error).toEqual(["error"]);
    });

    it("should create an invalid result with multiple errors", () => {
      const validation = invalid(["error1", "error2"]);
      expect(isFailure(validation)).toBe(true);
      if (isFailure(validation)) expect(validation.error).toEqual(["error1", "error2"]);
    });
  });

  describe("combine", () => {
    it("should combine all valid results", () => {
      const v1 = valid(1);
      const v2 = valid("hello");
      const v3 = valid(true);
      
      const combined = combine(v1, v2, v3);
      expect(isSuccess(combined)).toBe(true);
      if (isSuccess(combined)) {
        expect(combined.value).toEqual([1, "hello", true]);
      }
    });

    it("should accumulate errors from invalid results", () => {
      const v1 = valid(1);
      const v2 = invalid("error1");
      const v3 = invalid("error2");
      
      const combined = combine(v1, v2, v3);
      expect(isFailure(combined)).toBe(true);
      if (isFailure(combined)) {
        expect(combined.error).toEqual(["error1", "error2"]);
      }
    });

    it("should handle all invalid results", () => {
      const v1 = invalid("error1");
      const v2 = invalid(["error2", "error3"]);
      
      const combined = combine(v1, v2);
      expect(isFailure(combined)).toBe(true);
      if (isFailure(combined)) {
        expect(combined.error).toEqual(["error1", "error2", "error3"]);
      }
    });
  });

  describe("validateObject", () => {
    const validators = {
      name: (value: any) => {
        if (typeof value !== "string" || value.length === 0) {
          return invalid("Name must be a non-empty string");
        }
        return valid(value);
      },
      age: (value: any) => {
        if (typeof value !== "number" || value < 0) {
          return invalid("Age must be a non-negative number");
        }
        return valid(value);
      },
      email: (value: any) => {
        if (typeof value !== "string" || !value.includes("@")) {
          return invalid("Email must contain @");
        }
        return valid(value);
      },
    };

    it("should validate a valid object", () => {
      const input = { name: "John", age: 30, email: "john@example.com" };
      const result = validateObject(validators)(input);
      
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toEqual(input);
      }
    });

    it("should accumulate errors for invalid object", () => {
      const input = { name: "", age: -5, email: "invalid" };
      const result = validateObject(validators)(input);
      
      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toContain("Name must be a non-empty string");
        expect(result.error).toContain("Age must be a non-negative number");
        expect(result.error).toContain("Email must contain @");
        expect(result.error).toHaveLength(3);
      }
    });

    it("should handle partial validation failure", () => {
      const input = { name: "John", age: -5, email: "john@example.com" };
      const result = validateObject(validators)(input);
      
      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toEqual(["Age must be a non-negative number"]);
      }
    });
  });

  describe("sequence", () => {
    it("should sequence all valid results", () => {
      const validations = [valid(1), valid(2), valid(3)];
      const result = sequence(validations);
      
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toEqual([1, 2, 3]);
      }
    });

    it("should accumulate errors from invalid results", () => {
      const validations = [valid(1), invalid("error1"), invalid("error2")];
      const result = sequence(validations);
      
      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toEqual(["error1", "error2"]);
      }
    });
  });

  describe("mapValidation", () => {
    it("should map over a valid result", () => {
      const validation = valid(5);
      const mapped = mapValidation((x: number) => x * 2)(validation);
      
      expect(isSuccess(mapped)).toBe(true);
      if (isSuccess(mapped)) {
        expect(mapped.value).toBe(10);
      }
    });

    it("should not map over an invalid result", () => {
      const validation = invalid<string>("error");
      const mapped = mapValidation((x: number) => x * 2)(validation);
      
      expect(isFailure(mapped)).toBe(true);
      if (isFailure(mapped)) {
        expect(mapped.error).toEqual(["error"]);
      }
    });
  });

  describe("applyValidation", () => {
    it("should apply valid function to valid value", () => {
      const fnValidation = valid((x: number) => x * 2);
      const valueValidation = valid(5);
      const result = applyValidation(fnValidation)(valueValidation);
      
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toBe(10);
      }
    });

    it("should accumulate errors when function is invalid", () => {
      const fnValidation = invalid<string>("fn error");
      const valueValidation = valid(5);
      const result = applyValidation(fnValidation)(valueValidation);
      
      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toEqual(["fn error"]);
      }
    });

    it("should accumulate errors when value is invalid", () => {
      const fnValidation = valid((x: number) => x * 2);
      const valueValidation = invalid<string>("value error");
      const result = applyValidation(fnValidation)(valueValidation);
      
      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toEqual(["value error"]);
      }
    });

    it("should accumulate all errors", () => {
      const fnValidation = invalid<string>("fn error");
      const valueValidation = invalid<string>("value error");
      const result = applyValidation(fnValidation)(valueValidation);
      
      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toEqual(["fn error", "value error"]);
      }
    });
  });

  describe("fromResult and toResult", () => {
    it("should convert success Result to Validation", () => {
      const result = success(42);
      const validation = fromResult(result);
      
      expect(isSuccess(validation)).toBe(true);
      if (isSuccess(validation)) {
        expect(validation.value).toBe(42);
      }
    });

    it("should convert failure Result to Validation", () => {
      const result = failure("error");
      const validation = fromResult(result);
      
      expect(isFailure(validation)).toBe(true);
      if (isFailure(validation)) {
        expect(validation.error).toEqual(["error"]);
      }
    });

    it("should convert Validation back to Result", () => {
      const validation = invalid(["error1", "error2"]);
      const result = toResult(validation);
      
      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toEqual(["error1", "error2"]);
      }
    });
  });
});