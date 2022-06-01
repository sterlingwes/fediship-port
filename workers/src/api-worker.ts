import { nanoid } from "nanoid";
import { Env } from "./types";
import { jsonBadRequest, jsonNotFound, jsonSuccess } from "./utils/response";
import storage from "./utils/storage";

const handleErrorReport = async (request: Request, env: Env) => {
  const key = nanoid();
  await env.R2_ERROR_REPORTS.put(key, request.body);
  await env.KV_ERRORS.put(key, "0");
  return jsonSuccess({ saved: true });
};

const listErrorReports = async (env: Env) => {
  const items = await env.KV_ERRORS.list();
  return jsonSuccess({
    reports: items.keys,
    more: !items.list_complete,
  });
};

const getErrorReport = async (reportKey: string | undefined, env: Env) => {
  if (!reportKey) {
    return jsonBadRequest();
  }

  const reportBlob = await env.R2_ERROR_REPORTS.get(reportKey);
  if (!reportBlob) {
    return jsonNotFound();
  }

  const report = await reportBlob.json();
  return jsonSuccess({ report });
};

export default {
  async fetch(request: Request, env: Env) {
    const kv = storage(env);

    const path = request.url.split("/").slice(3).join("/");

    if (path === "api/v1/errors" && request.method.toLowerCase() === "post") {
      return handleErrorReport(request, env);
    }

    if (path === "api/v1/errors" && request.method.toLowerCase() === "get") {
      return listErrorReports(env);
    }

    if (
      path.startsWith("api/v1/errors/") &&
      request.method.toLowerCase() === "get"
    ) {
      const parts = path.split("/");
      const reportKey = parts.pop();
      return getErrorReport(reportKey, env);
    }

    if (path !== "api/v1/status") {
      return jsonNotFound({ path });
    }

    const instances = await kv.readAllInstances();
    const counts = Object.keys(instances).reduce(
      (acc, instanceUri) => {
        const instanceStatus = instances[instanceUri];
        let fetched = acc.fetched;
        let failed = acc.failed;
        let pending = acc.pending;
        let total = acc.total;

        if (instanceStatus?.s) {
          failed += 1;
        } else if (instanceStatus?.l) {
          fetched += 1;
        } else {
          pending += 1;
        }

        total += 1;

        return {
          fetched,
          failed,
          pending,
          total,
        };
      },
      {
        fetched: 0,
        failed: 0,
        pending: 0,
        total: 0,
      }
    );

    const stats = {
      failRatio: Math.round(
        (counts.failed / (counts.fetched + counts.failed)) * 100
      ),
      progress: Math.round(
        ((counts.fetched + counts.failed) / counts.total) * 100
      ),
    };

    return jsonSuccess({ counts, stats });
  },
};
