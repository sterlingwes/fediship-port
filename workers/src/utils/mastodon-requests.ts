import { RequestResult } from "../types";
import { errorResult, fetchWithTimeout, successResult } from "./fetch";
import { MastoInstanceInfo } from "./mastodon-types";

const asInstanceInfo = ({
  title,
  uri,
  version,
  short_description,
  description,
  stats,
  thumbnail,
}: Record<string, any>): MastoInstanceInfo => ({
  title,
  uri,
  version,
  short_description,
  description,
  stats,
  thumbnail,
});

export default () => {
  const getInstanceInfo = async (
    instanceUri: string
  ): RequestResult<MastoInstanceInfo> => {
    const infoResponse = await fetchWithTimeout(
      `https://${instanceUri}/api/v1/instance`
    );
    if (!infoResponse.ok) {
      console.error(
        `Failed to get instance info for ${instanceUri}. Status: ${infoResponse.status}`
      );
      return errorResult(infoResponse.status);
    }

    const contentType = infoResponse.headers.get("Content-type");
    if (contentType?.includes("json") === false) {
      console.error(`Unexpected response body format for ${instanceUri}`);
      return errorResult();
    }

    const result = await infoResponse.json<Record<string, any>>();
    if (!result.uri) {
      console.error(`Unexpected instance info response for ${instanceUri}`);
      return errorResult();
    }
    return successResult(asInstanceInfo(result));
  };

  const getInstancePeers = async (
    instanceUri: string
  ): RequestResult<string[]> => {
    const peerResponse = await fetchWithTimeout(
      `https://${instanceUri}/api/v1/instance/peers`
    );
    if (!peerResponse.ok) {
      console.error(
        `Failed to get instance peers for ${instanceUri}. Status: ${peerResponse.status}`
      );
      return errorResult(peerResponse.status);
    }

    const contentType = peerResponse.headers.get("Content-type");
    if (contentType?.includes("json") === false) {
      console.error(`Unexpected response body format for ${instanceUri}`);
      return errorResult();
    }

    const peers = await peerResponse.json<string[]>();
    if (!Array.isArray(peers)) {
      console.error(`Unexpected instance peers response for ${instanceUri}`);
      return errorResult();
    }

    return successResult(peers);
  };

  return { getInstanceInfo, getInstancePeers };
};
