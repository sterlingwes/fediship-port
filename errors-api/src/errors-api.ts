import { nanoid } from "nanoid";
import { jsonBadRequest, jsonNotFound, jsonSuccess, Env } from "api-common";

interface ReportKV {
  key: string;
  read: boolean;
}

const handleErrorReport = async (request: Request, env: Env) => {
  const key = nanoid();
  await env.R2_ERROR_REPORTS.put(key, request.body);
  await env.KV_ERRORS.put(
    Date.now().toString(),
    JSON.stringify({ key, read: false })
  );
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

  const reportKV = await env.KV_ERRORS.get(reportKey);
  if (!reportKV) {
    return jsonNotFound({ sys: "kv" });
  }

  const kvVal = JSON.parse(reportKV) as ReportKV;

  const reportBlob = await env.R2_ERROR_REPORTS.get(kvVal.key);
  if (!reportBlob) {
    return jsonNotFound({ sys: "r2" });
  }

  const report = await reportBlob.json();
  return jsonSuccess({ report });
};

export default {
  async fetch(request: Request, env: Env) {
    const path = request.url.split("/").slice(3).join("/");

    if (path === "v1/errors" && request.method.toLowerCase() === "post") {
      return handleErrorReport(request, env);
    }

    if (path === "v1/errors" && request.method.toLowerCase() === "get") {
      return listErrorReports(env);
    }

    if (
      path.startsWith("v1/errors/") &&
      request.method.toLowerCase() === "get"
    ) {
      const parts = path.split("/");
      const reportKey = parts.pop();
      return getErrorReport(reportKey, env);
    }

    return jsonNotFound({ path });
  },
};
