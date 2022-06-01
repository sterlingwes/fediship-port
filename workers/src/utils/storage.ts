import { Env, InstanceHostIndex } from "../types";
import { MastoInstanceInfo } from "./mastodon-types";
import { NodeInfoV2 } from "./nodeinfo-types";

const INSTANCE_INDEX_KV = "_instance_index";

export default (env: Env) => {
  let readCount = 0;
  let writeCount = 0;

  const readJson = async <T>(key: string) => {
    const value = await env.INSTANCE_INFO.get(key);
    readCount += 1;
    if (!value) return;
    try {
      return JSON.parse(value) as T;
    } catch (e) {
      console.warn(`Failed to readJson for key ${key}`);
    }
  };

  const saveJson = async (key: string, value: unknown) => {
    await env.INSTANCE_INFO.put(key, JSON.stringify(value));
    writeCount += 1;
  };

  let instanceIndex: InstanceHostIndex | undefined;

  const readAllInstances = async (noCache = false) => {
    if (instanceIndex && !noCache) {
      return instanceIndex;
    }
    const instances = await readJson<InstanceHostIndex>(INSTANCE_INDEX_KV);
    instanceIndex = instances ?? {};
    return instanceIndex;
  };

  const instanceSaves: InstanceHostIndex = {};

  const saveAllInstances = async () => {
    await saveJson(INSTANCE_INDEX_KV, { ...instanceIndex, ...instanceSaves });
  };

  const cleanUri = (uri: string) => uri.replace(/^https?:\/\//, "");

  const saveInstance = async (
    info: MastoInstanceInfo | { nfo: NodeInfoV2; uri: string },
    peers?: string[] | undefined
  ) => {
    await saveJson(info.uri, { ...info, peers });
    const currentIndexValue = instanceSaves[info.uri];
    instanceSaves[cleanUri(info.uri)] = { ...currentIndexValue, l: Date.now() };

    if (peers) {
      peers.forEach((peer) => {
        if (!instanceSaves[cleanUri(peer)]) {
          instanceSaves[cleanUri(peer)] = {};
        }
      });
    }
  };

  const saveInstanceSkip = async (instanceUri: string, status: number) => {
    const currentIndexValue = instanceSaves[instanceUri];
    instanceSaves[instanceUri] = {
      ...currentIndexValue,
      l: Date.now(),
      s: status,
    };
  };

  const logStats = () => {
    console.log(`kv operations: ${readCount} reads, ${writeCount} writes`);
  };

  const migrations = {
    fixUriPrefixes: async () => {
      const instances = await readAllInstances();
      const newInstances = Object.keys(instances).reduce(
        (acc, uri) => ({
          ...acc,
          [cleanUri(uri)]: instances[uri],
        }),
        {}
      );
      await saveJson(INSTANCE_INDEX_KV, newInstances);
    },
  };

  return {
    readAllInstances,
    saveAllInstances,
    saveInstance,
    saveInstanceSkip,
    logStats,
    migrations,
  };
};
