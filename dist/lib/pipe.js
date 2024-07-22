var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { isFailure } from "./result";
/**
 * The `pipe` function composes multiple functions, handling both synchronous and asynchronous processes.
 * @template T - The tuple of functions.
 * @template ExtractError<T> - The error type extracted from the tuple of functions.
 * @param {...Pipeline<T, ExtractError<T>>} fns - The functions to compose.
 * @returns {Function} A function that takes the input of the first function and returns a `Promise` resolving to a `Result` of the last function's output type and the error type.
 *
 * @example
 * const pipeline = pipe(
 *   async (input: string) => success(parseInt(input)),
 *   async (num: number) => success(num + 1),
 *   async (num: number) => success(num.toString())
 * );
 *
 * pipeline("42").then(result =>
 *   match({
 *     onSuccess: val => console.log("Success:", val),
 *     onFailure: err => console.log("Error:", err)
 *   })(result)
 * );
 */
export const pipe = (...fns) => {
    return (arg) => __awaiter(void 0, void 0, void 0, function* () {
        let result = yield fns[0](arg);
        for (const fn of fns.slice(1)) {
            if (isFailure(result))
                break;
            result = yield fn(result.value);
        }
        return result;
    });
};
//# sourceMappingURL=pipe.js.map