import { Env, InstanceHostIndex } from "./types";
import mastodonRequests from "./utils/mastodon-requests";
import { jsonError, jsonSuccess } from "./utils/response";
import storage from "./utils/storage";

const FETCH_TTL_MS = 8.64e7 * 5; // 5 days

const shouldFetchInstanceInfo = (index: InstanceHostIndex, uri: string) => {
  const instance = index[uri];
  if (!instance || !instance.l) {
    return true;
  }

  if (instance.s) {
    return false;
  }

  const lastFetchTime = instance.l;
  return Date.now() - lastFetchTime > FETCH_TTL_MS;
};

const runInstanceFetch = async (
  instanceUri: string,
  kv: ReturnType<typeof storage>
) => {
  const masto = mastodonRequests();
  console.log(`fetching ${instanceUri}`);

  try {
    const info = await masto.getInstanceInfo(instanceUri);
    if (!info.ok) {
      try {
        await kv.saveInstanceSkip(instanceUri, info.statusCode);
      } catch (e) {
        if (typeof e === "object" && (e as Error).message) {
          throw e;
        }

        throw new Error(`Failed marking skip for instance ${instanceUri}`);
      }
      return jsonError(`Failed to fetch instance info for ${instanceUri}`);
    }
    const peersResponse = await masto.getInstancePeers(instanceUri);
    let peers: string[] = [];
    if (peersResponse.ok && Array.isArray(peersResponse.result)) {
      peers = peersResponse.result;
    }

    await kv.saveInstance(info.result, peers);

    return jsonSuccess({ ok: true });
  } catch (e) {
    const error =
      typeof e === "object" ? (e as Error).message : "unknown error";
    console.error(`runInstanceFetch failed for ${instanceUri}: ${error}`);
    return jsonError(error);
  }
};

const initialInstance = "mastodon.social";

const randomIndex = (length: number) => Math.floor(Math.random() * length);

const cutTheDeck = (arr: string[]) => {
  const cut = randomIndex(arr.length);
  if (cut === 0 || cut === arr.length - 1) {
    return arr;
  }

  return [...arr.slice(cut), ...arr.slice(0, cut)];
};

const getNextInstanceUris = (index: InstanceHostIndex, requiredCount = 1) => {
  const uris = Object.keys(index);

  if (!uris.length) {
    console.log(`starting search from ${initialInstance}`);
    return [initialInstance];
  }

  const shuffledUris = cutTheDeck(uris);

  console.log(`searching for next fetch in ${shuffledUris.length} hosts`);

  const matches: string[] = [];
  while (matches.length < requiredCount && shuffledUris.length) {
    const uri = shuffledUris.shift();
    if (!uri) break;
    if (shouldFetchInstanceInfo(index, uri)) {
      matches.push(uri);
    }
  }

  return matches;
};

const run = async (env: Env) => {
  const requestBatch = parseInt(env.REQUEST_BATCH, 10);

  const kv = storage(env);
  const index = await kv.readAllInstances();
  const [nextUri] = getNextInstanceUris(index);
  if (!nextUri) {
    console.log("Skipping fetch, no uris outside TTL");
    return jsonSuccess({ ok: true, skip: true });
  }

  let response: Response;

  if (requestBatch > 1) {
    const nextBatch = getNextInstanceUris(index, requestBatch);
    console.log(
      `Targeting request batch of ${requestBatch}, found ${nextBatch.length}`
    );
    const responses = await Promise.all(
      nextBatch.map((uri) => runInstanceFetch(uri, kv))
    );
    const successCount = responses.reduce(
      (acc, res) => (res.ok ? acc + 1 : acc),
      0
    );
    console.log(
      `Done batch, ${successCount} of ${responses.length} successful`
    );
    response = jsonSuccess({ ok: true, batch: nextBatch.length, successCount });
  } else {
    response = await runInstanceFetch(nextUri, kv);
  }

  await kv.saveAllInstances();
  kv.logStats();
  return response;
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return new Response("Go away", { status: 404 });

    if (request.url.includes("favicon.ico")) {
      return new Response("No icon", { status: 404 });
    }
    return run(env);
  },

  async scheduled(
    _: ScheduledEvent,
    env: Env,
    ctx: EventContext<Env, any, any>
  ) {
    ctx.waitUntil(run(env));
  },
};
