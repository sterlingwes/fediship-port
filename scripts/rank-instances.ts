import { writeFileSync } from "fs";
import instanceKeys from "./out/instance_keys.json";

const instanceUserCounts: Record<string, number> = {};

instanceKeys.forEach((key) => {
  if (key.startsWith("http")) {
    console.log("skipping http", key);
    return;
  }

  const sanitizedKey = key.replace("/", "__");
  const fileName = `./out/instance_meta_${sanitizedKey}.json`;
  try {
    const meta = require(fileName);
    let users = -1;
    if (meta.nfo) {
      users = meta.nfo.usage?.users?.total ?? -1;
    } else {
      users = meta?.stats?.user_count ?? -1;
    }

    instanceUserCounts[key] = users;
  } catch (e) {
    console.log("skipped", key, e);
  }
});

writeFileSync(
  "out/_instance_user_counts.json",
  JSON.stringify(instanceUserCounts)
);

const sortedKeys = Object.keys(instanceUserCounts).sort((a, b) => {
  const countB = instanceUserCounts[b];
  const countA = instanceUserCounts[a];
  return countB - countA;
});

const topStop = 20;
let userTotal = 0;
const leaderboard = sortedKeys.slice(0, topStop);
const sortedWithCounts = leaderboard.map((key, n) => {
  const count = instanceUserCounts[key];
  userTotal += count;
  return `${n + 1}. ${key} (${count})`;
});

console.log({ sortedWithCounts, userTotal });

writeFileSync("out/_instance_rank.json", JSON.stringify(leaderboard));
