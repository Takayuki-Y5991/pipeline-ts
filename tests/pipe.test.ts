import { describe, expect, it } from "vitest";
import { pipe } from "../src/pipe";
import { failure, match, Result, success } from "../src/result";

// Define interfaces
interface Person {
  name: string;
  age: number;
}

interface Employee extends Person {
  role: string;
}

// Define functions for numbers and strings
const parseNumber = (input: string): Result<number, string> =>
  isNaN(Number(input)) ? failure("Not a number") : success(Number(input));
const increment = (num: number): Result<number, string> => success(num + 1);
const stringify = (num: number): Result<string, string> =>
  success(num.toString());

// Asynchronous functions for numbers and strings
const asyncParseNumber = async (
  input: string
): Promise<Result<number, string>> =>
  isNaN(Number(input)) ? failure("Not a number") : success(Number(input));
const asyncIncrement = async (num: number): Promise<Result<number, string>> =>
  success(num + 1);
const asyncStringify = async (num: number): Promise<Result<string, string>> =>
  success(num.toString());

// Define functions for objects and interfaces
const createPerson = (name: string, age: number): Result<Person, string> =>
  success({ name, age });
const promoteToEmployee = (
  person: Person,
  role: string
): Result<Employee, string> => success({ ...person, role });

const asyncCreatePerson = async (
  name: string,
  age: number
): Promise<Result<Person, string>> => success({ name, age });
const asyncPromoteToEmployee = async (
  person: Person,
  role: string
): Promise<Result<Employee, string>> => success({ ...person, role });

const personToString = (person: Person): Result<string, string> =>
  success(`${person.name} is ${person.age} years old`);
const employeeToString = (employee: Employee): Result<string, string> =>
  success(
    `${employee.name} is ${employee.age} years old and works as a ${employee.role}`
  );
const asyncPersonToString = async (
  person: Person
): Promise<Result<string, string>> =>
  success(`${person.name} is ${person.age} years old`);
const asyncEmployeeToString = async (
  employee: Employee
): Promise<Result<string, string>> =>
  success(
    `${employee.name} is ${employee.age} years old and works as a ${employee.role}`
  );
// Test cases
describe("Result Pipe Scenarios", () => {
  it("should parse, increment and stringify a number synchronously", async () =>
    await pipe(
      parseNumber,
      increment,
      stringify
    )("42").then((result) =>
      match({
        onSuccess: (val) => expect(val).toBe("43"),
        onFailure: (err) => expect.fail(`Unexpected failure: ${err}`),
      })(result)
    ));

  it("should fail if input is not a number synchronously", async () =>
    await pipe(
      parseNumber,
      increment,
      stringify
    )("abc").then((result) =>
      match({
        onSuccess: () => expect.fail("Expected failure but got success"),
        onFailure: (err) => expect(err).toBe("Not a number"),
      })(result)
    ));

  it("should parse, increment and stringify a number asynchronously", async () =>
    await pipe(
      asyncParseNumber,
      asyncIncrement,
      asyncStringify
    )("42").then((result) =>
      match({
        onSuccess: (val) => expect(val).toBe("43"),
        onFailure: (err) => expect.fail(`Unexpected failure: ${err}`),
      })(result)
    ));

  it("should fail if input is not a number asynchronously", async () =>
    await pipe(
      asyncParseNumber,
      asyncIncrement,
      asyncStringify
    )("abc").then((result) =>
      match({
        onSuccess: () => expect.fail("Expected failure but got success"),
        onFailure: (err) => expect(err).toBe("Not a number"),
      })(result)
    ));

  it("should parse, increment and stringify a number with mixed functions", async () =>
    await pipe(
      parseNumber,
      asyncIncrement,
      stringify,
      asyncStringify
    )("42").then((result) =>
      match({
        onSuccess: (val) => expect(val).toBe("43"),
        onFailure: (err) => expect.fail(`Unexpected failure: ${err}`),
      })(result)
    ));

  it("should fail if input is not a number with mixed functions", async () =>
    await pipe(
      parseNumber,
      asyncIncrement,
      stringify,
      asyncStringify
    )("abc").then((result) =>
      match({
        onSuccess: () => expect.fail("Expected failure but got success"),
        onFailure: (err) => expect(err).toBe("Not a number"),
      })(result)
    ));

  it("should map a number to a string synchronously", async () =>
    await pipe(
      parseNumber,
      stringify
    )("42").then((result) =>
      match({
        onSuccess: (val) => expect(val).toBe("42"),
        onFailure: (err) => expect.fail(`Unexpected failure: ${err}`),
      })(result)
    ));

  it("should chain asynchronous functions correctly", async () =>
    await pipe(
      parseNumber,
      asyncIncrement,
      asyncStringify
    )("42").then((result) =>
      match({
        onSuccess: (val) => expect(val).toBe("43"),
        onFailure: (err) => expect.fail(`Unexpected failure: ${err}`),
      })(result)
    ));

  it("should create and promote a person synchronously", async () =>
    await pipe(
      (input: { name: string; age: number }) =>
        createPerson(input.name, input.age),
      (person) => promoteToEmployee(person, "Developer"),
      employeeToString
    )({ name: "John", age: 30 }).then((result) =>
      match({
        onSuccess: (val) =>
          expect(val).toBe("John is 30 years old and works as a Developer"),
        onFailure: (err) => expect.fail(`Unexpected failure: ${err}`),
      })(result)
    ));

  it("should create and promote a person asynchronously", async () =>
    await pipe(
      (input: { name: string; age: number }) =>
        asyncCreatePerson(input.name, input.age),
      (person) => asyncPromoteToEmployee(person, "Developer"),
      asyncEmployeeToString
    )({ name: "John", age: 30 }).then((result) =>
      match({
        onSuccess: (val) =>
          expect(val).toBe("John is 30 years old and works as a Developer"),
        onFailure: (err) => expect.fail(`Unexpected failure: ${err}`),
      })(result)
    ));
});
