# PipelineTS

[![npm version](https://badge.fury.io/js/@konkon5991%2Fpipeline-ts.svg)](https://badge.fury.io/js/@konkon5991%2Fpipeline-ts)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-97.45%25-brightgreen)](https://github.com/Takayuki-Y5991/pipeline-ts)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight TypeScript library for Railway Oriented Programming (ROP). PipelineTS provides a comprehensive set of functional programming utilities for handling success and failure cases with type safety.

## Features

- 🚀 **Zero Dependencies** - Lightweight and fast
- 🔒 **Type-Safe** - Full TypeScript support with strict typing
- ⚡ **Performance** - Separate sync/async pipelines for optimal performance
- 🛠️ **Comprehensive** - Complete set of monadic operations
- 🧪 **Validation** - Error accumulation support
- 🔧 **Debugging** - Built-in debugging and tracing utilities
- 📦 **Tree-shakable** - Import only what you need

## Installation

```bash
npm install @konkon5991/pipeline-ts
# or
yarn add @konkon5991/pipeline-ts
# or
pnpm add @konkon5991/pipeline-ts
```

## Quick Start

```typescript
import { pipe, success, failure, map, fold } from '@konkon5991/pipeline-ts';

// Define your functions
const parseNumber = (input: string) =>
  isNaN(Number(input)) ? failure("Not a number") : success(Number(input));

const double = (num: number) => success(num * 2);

const toString = (num: number) => success(num.toString());

// Create a pipeline
const pipeline = pipe(parseNumber, double, toString);

// Execute the pipeline
const result = await pipeline("21");
const output = fold(
  (error) => `Error: ${error}`,
  (value) => `Success: ${value}`
)(result);

console.log(output); // "Success: 42"
```

## Core Concepts

### Result Type

The `Result<T, E>` type represents either a success (`Success<T>`) or a failure (`Failure<E>`):

```typescript
import { Result, success, failure, isSuccess, isFailure } from '@konkon5991/pipeline-ts';

const successResult: Result<number, string> = success(42);
const failureResult: Result<number, string> = failure("Error occurred");

if (isSuccess(successResult)) {
  console.log(successResult.value); // 42
}

if (isFailure(failureResult)) {
  console.log(failureResult.error); // "Error occurred"
}
```

## Essential Operations

### Map Operations

Transform success values while preserving failures:

```typescript
import { map, mapAsync, success, failure } from '@konkon5991/pipeline-ts';

const result = success(5);
const doubled = map((x: number) => x * 2)(result);
// Result: success(10)

const asyncDoubled = await mapAsync(async (x: number) => x * 2)(result);
// Result: success(10)
```

### FlatMap (Chain) Operations

Chain operations that return Results:

```typescript
import { flatMap, success, failure } from '@konkon5991/pipeline-ts';

const divide = (x: number, y: number) =>
  y === 0 ? failure("Division by zero") : success(x / y);

const result = success(10);
const divided = flatMap((x: number) => divide(x, 2))(result);
// Result: success(5)
```

### Error Handling

Handle and transform errors:

```typescript
import { mapError, recover, orElse } from '@konkon5991/pipeline-ts';

const result = failure("Network error");

// Transform error
const mappedError = mapError((err: string) => err.toUpperCase())(result);

// Recover from error
const recovered = recover((err: string) => 42)(result);

// Provide alternative
const alternative = orElse(() => success(0))(result);
```

## Pipelines

### Async Pipelines

For functions that may be asynchronous:

```typescript
import { pipe, success, failure } from '@konkon5991/pipeline-ts';

const validateEmail = async (email: string) =>
  email.includes("@") ? success(email) : failure("Invalid email");

const normalizeEmail = async (email: string) =>
  success(email.toLowerCase().trim());

const sendEmail = async (email: string) => {
  // Simulate API call
  return success(`Email sent to ${email}`);
};

const pipeline = pipe(validateEmail, normalizeEmail, sendEmail);

const result = await pipeline("USER@EXAMPLE.COM");
// Result: success("Email sent to user@example.com")
```

### Sync Pipelines

For better performance with synchronous functions:

```typescript
import { pipeSync, success, failure } from '@konkon5991/pipeline-ts';

const validateAge = (age: number) =>
  age >= 18 ? success(age) : failure("Must be 18 or older");

const calculateDiscount = (age: number) =>
  age >= 65 ? success(0.2) : success(0.1);

const formatDiscount = (discount: number) =>
  success(`${(discount * 100).toFixed(0)}% discount`);

const pipeline = pipeSync(validateAge, calculateDiscount, formatDiscount);

const result = pipeline(25);
// Result: success("10% discount")
```

## Validation

Accumulate multiple errors instead of short-circuiting:

```typescript
import { validateObject, valid, invalid } from '@konkon5991/pipeline-ts';

const validators = {
  name: (value: any) =>
    typeof value === "string" && value.length > 0
      ? valid(value)
      : invalid("Name is required"),
  
  age: (value: any) =>
    typeof value === "number" && value >= 0
      ? valid(value)
      : invalid("Age must be a positive number"),
  
  email: (value: any) =>
    typeof value === "string" && value.includes("@")
      ? valid(value)
      : invalid("Email must contain @")
};

const result = validateObject(validators)({
  name: "",
  age: -5,
  email: "invalid"
});

// Result: failure(["Name is required", "Age must be a positive number", "Email must contain @"])
```

## Async Utilities

### Parallel Execution

```typescript
import { parallel, success } from '@konkon5991/pipeline-ts';

const fetchUser = async () => success({ id: 1, name: "John" });
const fetchPosts = async () => success([{ id: 1, title: "Hello" }]);
const fetchComments = async () => success([{ id: 1, text: "Nice!" }]);

const result = await parallel(fetchUser, fetchPosts, fetchComments);
// Result: success([user, posts, comments])
```

### Retry with Backoff

```typescript
import { retry, success, failure } from '@konkon5991/pipeline-ts';

const unstableAPI = async () => {
  if (Math.random() < 0.7) {
    return failure("Network error");
  }
  return success("Data fetched");
};

const result = await retry(unstableAPI, {
  maxAttempts: 3,
  delay: 1000,
  backoff: 'exponential',
  onRetry: (attempt, error) => console.log(`Retry ${attempt}: ${error}`)
});
```

### Sequential Processing

```typescript
import { sequential, success } from '@konkon5991/pipeline-ts';

const step1 = async () => success("Step 1 complete");
const step2 = async () => success("Step 2 complete");
const step3 = async () => success("Step 3 complete");

const result = await sequential(step1, step2, step3);
// Result: success(["Step 1 complete", "Step 2 complete", "Step 3 complete"])
```

## Debugging

### Inspection and Logging

```typescript
import { inspect, trace, log, pipe } from '@konkon5991/pipeline-ts';

const pipeline = pipe(
  inspect({ label: "Input" }),
  (x: number) => success(x * 2),
  log({
    onSuccess: (value) => `Doubled: ${value}`,
    onFailure: (error) => `Error: ${error}`
  }),
  trace("Final step", (result) => {
    // Process result
    return result;
  })
);
```

### Pipeline Debugging

```typescript
import { PipelineDebugger } from '@konkon5991/pipeline-ts';

const debugger = new PipelineDebugger();

const step1 = debugger.wrap("parse", parseNumber);
const step2 = debugger.wrap("validate", validateAge);
const step3 = debugger.wrap("transform", transformData);

await step1("42");
await step2(42);
await step3(validatedData);

debugger.printReport();
// Outputs timing and result information for each step
```

## Error Types and Utilities

### Custom Error Types

```typescript
interface ValidationError {
  field: string;
  message: string;
}

interface NetworkError {
  code: number;
  message: string;
}

type AppError = ValidationError | NetworkError;

const validateField = (value: string): Result<string, ValidationError> =>
  value.length > 0 
    ? success(value)
    : failure({ field: "name", message: "Required" });
```

### Error Recovery Patterns

```typescript
import { recoverWith, mapError } from '@konkon5991/pipeline-ts';

const fetchWithFallback = pipe(
  primaryAPI,
  recoverWith((error) => fallbackAPI()),
  mapError((error) => ({ ...error, recovered: true }))
);
```

## API Reference

### Core Functions

- `success<T>(value: T)` - Create a success result
- `failure<E>(error: E)` - Create a failure result
- `isSuccess<T, E>(result: Result<T, E>)` - Type guard for success
- `isFailure<T, E>(result: Result<T, E>)` - Type guard for failure

### Transformation Functions

- `map<T, U, E>(fn: (value: T) => U)` - Transform success value
- `flatMap<T, U, E>(fn: (value: T) => Result<U, E>)` - Chain operations
- `fold<T, E, U>(onFailure: (error: E) => U, onSuccess: (value: T) => U)` - Handle both cases
- `bimap<T, U, E, F>(onSuccess: (value: T) => U, onFailure: (error: E) => F)` - Transform both cases

### Error Handling Functions

- `mapError<T, E, F>(fn: (error: E) => F)` - Transform error
- `recover<T, E>(fn: (error: E) => T)` - Recover from error
- `orElse<T, E>(fn: () => Result<T, E>)` - Provide alternative

### Pipeline Functions

- `pipe(...fns)` - Async pipeline composition
- `pipeSync(...fns)` - Sync pipeline composition

## Test Coverage

Current test coverage: **97.45%**

- Statements: 97.45%
- Branches: 98.11%
- Functions: 94.73%
- Lines: 97.45%

## Performance

PipelineTS is designed for performance:

- Zero dependencies
- Separate sync/async paths
- Tree-shakable modules
- Optimized for V8 engine

## Comparison with Other Libraries

| Feature | PipelineTS | fp-ts | Effect-ts |
|---------|------------|-------|-----------|
| Bundle Size | ~5KB | ~50KB | ~200KB |
| Dependencies | 0 | 0 | Many |
| Learning Curve | Low | High | Very High |
| Type Safety | High | Very High | Very High |
| Performance | High | Medium | Low |

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes.