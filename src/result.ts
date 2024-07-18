export class Success<T> {
  readonly isSuccess = true;
  readonly isFailure = false;

  constructor(public readonly value: T) {}
}

export class Failure<E> {
  readonly isSuccess = false;
  readonly isFailure = true;

  constructor(public readonly error: E) {}
}

export type Result<T, E> = Success<T> | Failure<E>;

export const isSuccess = <T, E>(result: Result<T, E>): result is Success<T> =>
  result.isSuccess;
export const isFailure = <T, E>(result: Result<T, E>): result is Failure<E> =>
  result.isFailure;

export const success = <T>(value: T): Result<T, never> => new Success(value);
export const failure = <E>(error: E): Result<never, E> => new Failure(error);

export const of = <T>(value: T): Result<T, never> => success(value);

export const map =
  <T, R, E>(fn: (value: T) => R | Promise<R>) =>
  async (result: Result<T, E>): Promise<Result<R, E>> => {
    if (isSuccess(result)) {
      return success(await fn(result.value));
    }
    return result;
  };

export const chain =
  <T, U, E, F>(fn: (value: T) => Result<U, F> | Promise<Result<U, F>>) =>
  async (result: Result<T, E>): Promise<Result<U, E | F>> => {
    if (isSuccess(result)) {
      return await fn(result.value);
    }
    return result as Result<U, E | F>;
  };

export const bimap =
  <T, R, E, F>(
    fn: (value: T) => R | Promise<R>,
    fnError: (error: E) => F | Promise<F>
  ) =>
  async (result: Result<T, E>): Promise<Result<R, F>> => {
    if (isSuccess(result)) {
      return success(await fn(result.value));
    } else {
      return failure(await fnError(result.error));
    }
  };

export const mapError =
  <T, E, F>(fnError: (error: E) => F | Promise<F>) =>
  async (result: Result<T, E>): Promise<Result<T, F>> => {
    if (isFailure(result)) {
      return failure(await fnError(result.error));
    }
    return result;
  };

export const match =
  <T, E, RS, RF>({
    onSuccess,
    onFailure,
  }: {
    onSuccess: (value: T) => RS | Promise<RS>;
    onFailure: (error: E) => RF | Promise<RF>;
  }) =>
  async (result: Result<T, E>): Promise<RS | RF> => {
    if (result.isSuccess) {
      return onSuccess(result.value);
    } else {
      return onFailure(result.error);
    }
  };

export const fromPromise = async <T, E extends Error = Error>(
  promise: Promise<T>
): Promise<Result<T, E>> => {
  try {
    const value = await promise;
    return success(value);
  } catch (error) {
    return failure(error as E);
  }
};
