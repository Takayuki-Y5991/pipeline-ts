import { isFailure, Result, success, Success } from "../src/result";

export const pipe = <T, R, E>(
  ...fns: Array<(arg: T) => Result<R, E> | Promise<Result<R, E>>>
): ((arg: T) => Promise<Result<R, E>>) => {
  return async (arg: T): Promise<Result<R, E>> => {
    let result: Result<any, E> = success(arg);
    for (const fn of fns) {
      if (isFailure(result)) break;
      result = await fn((result as Success<any>).value);
    }
    return result as Result<R, E>;
  };
};
