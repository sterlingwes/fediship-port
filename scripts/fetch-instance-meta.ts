import fetch from "node-fetch";
import { writeFileSync } from "fs";
import config from "./fetch-config.json";
import instanceKeys from "./out/instance_keys.json";

const token = config.token;
const instanceId = config.instanceInfoKVId;
const accountId = config.cfAccountId;
const host = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${instanceId}`;

export {};

const getInstanceMeta = async (key: string) => {
  const response = await fetch(`${host}/values/${key}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.log("failed", response.status, response.statusText);
    return;
  }

  const sanitizedKey = key.replace("/", "__");
  writeFileSync(
    "out/instance_meta_" + sanitizedKey + ".json",
    await response.text()
  );
};

const run = async () => {
  let skip = true;
  await instanceKeys.reduce(async (chain, key) => {
    if (key.startsWith("_")) {
      return chain;
    }

    if (skip) {
      if (key === "lapineige.fr/wp") {
        skip = false;
      }
      return chain;
    }

    await chain;
    console.log("fetching", key);
    await getInstanceMeta(key);
  }, Promise.resolve() as Promise<unknown>);
};

run();
