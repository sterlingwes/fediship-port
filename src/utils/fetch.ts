import { ErrorResult, SuccessResult } from "../types";

export const successResult = <T>(result: T): SuccessResult<T> => ({
  ok: true,
  result,
});

export const errorResult = (status?: number): ErrorResult => ({
  ok: false,
  statusCode: status || 1,
});

const jsonHeader = { "Content-type": "application/json" };

export const fetchWithTimeout = (
  info: Request | string,
  init?: RequestInit
): Promise<Response> => {
  const signal = AbortSignal.timeout(10_000);
  return fetch(info, {
    ...init,
    signal,
    headers: { ...init?.headers, ...jsonHeader },
  });
};
