import { failure, Result } from "./result";

export const pipe = <T, R>(
  ...fns: Array<(arg: T) => R | Promise<R>>
): ((arg: T) => Promise<Result<R, Error>>) => {
  return (arg: T): Promise<Result<R, Error>> => {
    return fns.reduce(async (acc, fn) => {
      try {
        const result = await acc;
        return Promise.resolve(fn(result as T));
      } catch (error) {
        return failure(error as Error);
      }
    }, Promise.resolve(arg as any)) as Promise<Result<R, Error>>;
  };
};
