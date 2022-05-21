export interface Env {
  INSTANCE_INFO: KVNamespace;
  REQUEST_BATCH: string;
  DEV: string; // "0" or "1"
}

export type InstanceHostIndex = Record<string, RecordStatus | undefined>;
interface RecordStatus {
  l?: number; // last fetch timestamp
  s?: number; // value may be an HTTP error code, use as signal on whether to skip
}

export interface SuccessResult<T> {
  ok: true;
  result: T;
}

export interface ErrorResult {
  ok: false;
  statusCode: number;
}

export type RequestResult<T> = Promise<SuccessResult<T> | ErrorResult>;
