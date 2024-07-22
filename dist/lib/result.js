var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * Represents a successful result.
 * @template T - The type of the value.
 */
export class Success {
    /**
     * Creates an instance of Success.
     * @param {T} value - The value of the successful result.
     */
    constructor(value) {
        this.value = value;
        this.isSuccess = true;
        this.isFailure = false;
    }
}
/**
 * Represents a failed result.
 * @template E - The type of the error.
 */
export class Failure {
    /**
     * Creates an instance of Failure.
     * @param {E} error - The error of the failed result.
     */
    constructor(error) {
        this.error = error;
        this.isSuccess = false;
        this.isFailure = true;
    }
}
/**
 * Checks if the given result is a Success.
 * @template T - The type of the value in case of success.
 * @template E - The type of the error in case of failure.
 * @param {Result<T, E>} result - The result to check.
 * @returns {result is Success<T>} - True if the result is a Success, otherwise false.
 */
export const isSuccess = (result) => result.isSuccess;
/**
 * Checks if the given result is a Failure.
 * @template T - The type of the value in case of success.
 * @template E - The type of the error in case of failure.
 * @param {Result<T, E>} result - The result to check.
 * @returns {result is Failure<E>} - True if the result is a Failure, otherwise false.
 */
export const isFailure = (result) => result.isFailure;
/**
 * Creates a success result.
 * @template T - The type of the value.
 * @param {T} value - The value of the success result.
 * @returns {Result<T, never>} - The success result.
 */
export const success = (value) => new Success(value);
/**
 * Creates a failure result.
 * @template E - The type of the error.
 * @param {E} error - The error of the failure result.
 * @returns {Result<never, E>} - The failure result.
 */
export const failure = (error) => new Failure(error);
/**
 * Wraps a value in a success result.
 * @template T - The type of the value.
 * @param {T} value - The value to wrap.
 * @returns {Result<T, never>} - The success result.
 */
export const of = (value) => success(value);
/**
 * Matches a result to a function based on whether it is a success or a failure.
 * @template T - The type of the value in case of success.
 * @template E - The type of the error in case of failure.
 * @template RS - The return type of the success handler.
 * @template RF - The return type of the failure handler.
 * @param {Object} handlers - An object containing the success and failure handlers.
 * @param {(value: T) => RS | Promise<RS>} handlers.onSuccess - The success handler.
 * @param {(error: E) => RF | Promise<RF>} handlers.onFailure - The failure handler.
 * @returns {(result: Result<T, E>) => Promise<RS | RF>} - A function that takes a result and returns a promise that resolves to the result of the appropriate handler.
 */
export const match = ({ onSuccess, onFailure, }) => (result) => __awaiter(void 0, void 0, void 0, function* () { return isSuccess(result) ? onSuccess(result.value) : onFailure(result.error); });
/**
 * Converts a promise to a result.
 * @template T - The type of the value in case of success.
 * @template E - The type of the error in case of failure.
 * @param {Promise<T>} promise - The promise to convert.
 * @returns {Promise<Result<T, E>>} - A promise that resolves to a result.
 */
export const fromPromise = (promise) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const value = yield promise;
        return success(value);
    }
    catch (error) {
        return failure(error);
    }
});
//# sourceMappingURL=result.js.map