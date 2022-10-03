import { ChainId } from "@thirdweb-dev/react";

const DESIRED_CHAIN = process.env.NEXT_PUBLIC_DESIRED_CHAIN;

export const DESIRED_CHAIN_ID =
  DESIRED_CHAIN === "mumbai" ? ChainId.Mumbai : ChainId.Polygon;
