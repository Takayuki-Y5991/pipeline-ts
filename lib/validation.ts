import { Result, Success, Failure, success, failure, isSuccess, isFailure } from './result';

/**
 * Represents a validation result that accumulates errors.
 * @template T - The type of the value in case of success.
 * @template E - The type of the errors.
 */
export type Validation<T, E> = Success<T> | Failure<E[]>;

/**
 * Creates a validation success.
 * @template T - The type of the value.
 * @param {T} value - The value of the success validation.
 * @returns {Validation<T, never>} - The success validation.
 */
export const valid = <T>(value: T): Validation<T, never> => success(value);

/**
 * Creates a validation failure.
 * @template E - The type of the error.
 * @param {E | E[]} error - The error(s) of the failure validation.
 * @returns {Validation<never, E>} - The failure validation.
 */
export const invalid = <E>(error: E | E[]): Validation<never, E> => 
  failure(Array.isArray(error) ? error : [error]);

/**
 * Combines multiple validations, accumulating errors.
 * @template T - The tuple type of all success values.
 * @template E - The type of the error.
 * @param {...Validation<any, E>[]} validations - The validations to combine.
 * @returns {Validation<T, E>} - Combined validation result.
 */
export const combine = <T extends readonly any[], E>(
  ...validations: { [K in keyof T]: Validation<T[K], E> }
): Validation<T, E> => {
  const errors: E[] = [];
  const values: any[] = [];

  for (const validation of validations) {
    if (isFailure(validation)) {
      errors.push(...validation.error);
    } else {
      values.push(validation.value);
    }
  }

  return errors.length > 0 ? failure(errors) : success(values as unknown as T);
};

/**
 * Validates an object's properties.
 * @template T - The type of the object.
 * @template E - The type of the error.
 * @param {Record<keyof T, (value: any) => Validation<any, E>>} validators - Object with validators for each property.
 * @returns {(input: any) => Validation<T, E>} - A function that validates an input object.
 */
export const validateObject = <T extends Record<string, any>, E>(
  validators: { [K in keyof T]: (value: any) => Validation<T[K], E> }
) => (input: any): Validation<T, E> => {
  const errors: E[] = [];
  const result = {} as T;

  for (const [key, validator] of Object.entries(validators) as [keyof T, (value: any) => Validation<any, E>][]) {
    const validation = validator(input[key]);
    if (isFailure(validation)) {
      errors.push(...validation.error);
    } else {
      result[key] = validation.value;
    }
  }

  return errors.length > 0 ? failure(errors) : success(result);
};

/**
 * Sequences an array of validations into a validation of an array.
 * @template T - The type of the value.
 * @template E - The type of the error.
 * @param {Validation<T, E>[]} validations - Array of validations.
 * @returns {Validation<T[], E>} - Validation of array.
 */
export const sequence = <T, E>(
  validations: Validation<T, E>[]
): Validation<T[], E> => {
  const errors: E[] = [];
  const values: T[] = [];

  for (const validation of validations) {
    if (isFailure(validation)) {
      errors.push(...validation.error);
    } else {
      values.push(validation.value);
    }
  }

  return errors.length > 0 ? failure(errors) : success(values);
};

/**
 * Maps a function over a validation success.
 * @template T - The type of the value in case of success.
 * @template U - The type of the mapped value.
 * @template E - The type of the error.
 * @param {(value: T) => U} fn - The mapping function.
 * @returns {(validation: Validation<T, E>) => Validation<U, E>} - A function that maps a validation.
 */
export const mapValidation =
  <T, U, E>(fn: (value: T) => U) =>
  (validation: Validation<T, E>): Validation<U, E> =>
    isSuccess(validation) ? success(fn(validation.value)) : validation;

/**
 * Applies a validation of a function to a validation of a value.
 * @template T - The type of the value.
 * @template U - The type of the result.
 * @template E - The type of the error.
 * @param {Validation<(value: T) => U, E>} fnValidation - Validation of a function.
 * @returns {(validation: Validation<T, E>) => Validation<U, E>} - A function that applies the validation.
 */
export const applyValidation =
  <T, U, E>(fnValidation: Validation<(value: T) => U, E>) =>
  (validation: Validation<T, E>): Validation<U, E> => {
    if (isSuccess(fnValidation) && isSuccess(validation)) {
      return success(fnValidation.value(validation.value));
    }
    
    const errors: E[] = [];
    if (isFailure(fnValidation)) errors.push(...fnValidation.error);
    if (isFailure(validation)) errors.push(...validation.error);
    
    return failure(errors);
  };

/**
 * Converts a Result to a Validation.
 * @template T - The type of the value.
 * @template E - The type of the error.
 * @param {Result<T, E>} result - The result to convert.
 * @returns {Validation<T, E>} - The validation.
 */
export const fromResult = <T, E>(result: Result<T, E>): Validation<T, E> =>
  isSuccess(result) ? valid(result.value) : invalid(result.error);

/**
 * Converts a Validation to a Result.
 * @template T - The type of the value.
 * @template E - The type of the error.
 * @param {Validation<T, E>} validation - The validation to convert.
 * @returns {Result<T, E[]>} - The result.
 */
export const toResult = <T, E>(validation: Validation<T, E>): Result<T, E[]> =>
  validation as Result<T, E[]>;