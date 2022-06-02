import fetch from "node-fetch";
import { writeFileSync } from "fs";
import config from "./fetch-config.json";

const token = config.token;
const instanceId = config.instanceInfoKVId;
const accountId = config.cfAccountId;
const indexKey = "_instance_index";
const host = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${instanceId}`;

export {};

const getInstanceIndex = async () => {
  const response = await fetch(`${host}/values/${indexKey}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.log("failed", response.status, response.statusText);
    return;
  }

  writeFileSync("out/instance_index.json", await response.text());
};

const listKeys = async (
  priorList: string[] = [],
  cursor?: string
): Promise<void> => {
  const nextParam = cursor ? "?cursor=" + cursor : "";
  const response = await fetch(`${host}/keys${nextParam}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.log("failed", response.status, response.statusText);
    return;
  }

  const json = await response.json();
  const fetchMore = json.result_info.count >= 1000;
  const list = json.result.map((key: { name: string }) => key.name);
  console.log("fetched", json.result_info.count);
  const newList = priorList.concat(list);

  if (fetchMore) {
    return listKeys(newList, json.result_info.cursor);
  }

  writeFileSync("out/instance_keys.json", JSON.stringify(newList));
};

const run = async () => {
  // await getInstanceIndex();
  await listKeys();
};

run();
