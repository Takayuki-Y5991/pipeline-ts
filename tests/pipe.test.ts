import { describe, expect, it } from "vitest";
import { pipe } from "../src/pipe";

describe("Pipe", () => {
  it("should pipe synchronous functions", async () => {
    const add = (x: number) => x + 1;
    const double = (x: number) => x * 2;
    const result = await pipe(add, double)(2);
    expect(result).toBe(6);
  });

  it("should pipe asynchronous functions", async () => {
    const add = async (x: number) => x + 1;
    const double = async (x: number) => x * 2;
    const result = await pipe(add, double)(2);
    expect(result).toBe(6);
  });

  it("should pipe mixed synchronous and asynchronous functions", async () => {
    const add = (x: number) => x + 1;
    const double = async (x: number) => x * 2;
    const result = await pipe(add, double)(2);
    expect(result).toBe(6);
  });
});
