import { RequestResult } from "../types";
import { errorResult, fetchWithTimeout, successResult } from "./fetch";
import { NodeInfoV2, NodeInfoWellKnown } from "./nodeinfo-types";

export default () => {
  const getNodeInfo = async (
    instanceUri: string
  ): RequestResult<NodeInfoV2> => {
    const infoLinks = await fetchWithTimeout(
      `https://${instanceUri}/.well-known/nodeinfo`
    );
    if (!infoLinks.ok) {
      console.log(`No nodeinfo for ${instanceUri}`);
      return errorResult(infoLinks.status);
    }

    const linksResponse: NodeInfoWellKnown = await infoLinks.json();
    const [link] = linksResponse.links;
    if (link && typeof link.href !== "string") {
      console.log(`No nodeinfo link href in well-known for ${instanceUri}`);
      return errorResult(404);
    }

    console.log(
      `Found nodeinfo link for ${instanceUri} (${linksResponse.links.length})`
    );

    const nodeInfoResponse = await fetchWithTimeout(link.href);
    if (!nodeInfoResponse.ok) {
      console.error(
        `Failed to fetch node info link for ${instanceUri} (${nodeInfoResponse.status})`
      );
      return errorResult(nodeInfoResponse.status);
    }

    const nodeInfo = await nodeInfoResponse.json();
    return {
      ok: true,
      result: nodeInfo as NodeInfoV2,
    };
  };

  return { getNodeInfo };
};
