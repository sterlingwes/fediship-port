import { Env } from "./types";
import { jsonNotFound, jsonSuccess } from "./utils/response";
import storage from "./utils/storage";

export default {
  async fetch(request: Request, env: Env) {
    const path = request.url.split("/").slice(3).join("/");

    if (path !== "api/v1/status") {
      return jsonNotFound({ path });
    }

    const kv = storage(env);
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
    };

    return jsonSuccess({ counts, stats });
  },
};
