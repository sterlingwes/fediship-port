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
  const info = await masto.getInstanceInfo(instanceUri);
  if (!info.ok) {
    await kv.saveInstanceSkip(instanceUri, info.statusCode);
    return jsonError("Failed to fetch instance info");
  }
  const peers = await masto.getInstancePeers(instanceUri);

  await kv.saveInstance(info.result, peers.ok ? peers.result : []);
  await kv.saveAllInstances();

  return jsonSuccess({ ok: true });
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

const getNextInstanceUri = (index: InstanceHostIndex) => {
  const uris = Object.keys(index);

  if (!uris.length) {
    console.log(`starting search from ${initialInstance}`);
    return initialInstance;
  }

  const shuffledUris = cutTheDeck(uris);

  console.log(`searching for next fetch in ${shuffledUris.length} hosts`);

  let match;
  while (!match && shuffledUris.length) {
    const uri = shuffledUris.shift();
    if (!uri) break;
    if (shouldFetchInstanceInfo(index, uri)) {
      match = uri;
      console.log(`next fetch found: ${uri}`);
    }
  }

  return match;
};

const run = async (env: Env) => {
  const requestBatch = parseInt(env.REQUEST_BATCH, 10);

  const kv = storage(env);
  const index = await kv.readAllInstances();
  const nextUri = getNextInstanceUri(index);
  if (!nextUri) {
    console.log("Skipping fetch, no uris outside TTL");
    return jsonSuccess({ ok: true, skip: true });
  }

  if (requestBatch > 1) {
    // console.log(`Doing request batch of ${requestBatch}`);
    // await [...Array(requestBatch)].reduce((chain) => {
    //   return chain.then(() => {
    //     const nextBatchUri = getNextInstanceUri(index);
    //     if (!nextBatchUri) {
    //       console.log("Ending batch run, no uris outside TTL");
    //       return;
    //     }
    //     return runInstanceFetch(nextBatchUri, kv);
    //   });
    // }, Promise.resolve() as Promise<unknown>);
    return jsonSuccess({ batch: true });
  } else {
    console.log(env);
  }

  return runInstanceFetch(nextUri, kv);
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // return new Response("Go away", { status: 404 });

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
