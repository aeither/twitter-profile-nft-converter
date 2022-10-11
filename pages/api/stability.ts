import { generate } from "stability-ts";

import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import { DESIRED_CHAIN_NAME } from "../../utils/constants";
import "../styles/globals.css";

type ProfileInfo = {
  url: string;
  username: string;
  name: string;
  description: string;
  id: string;
};

export default async function server(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (!process.env.DREAMSTUDIO_API_KEY) {
      throw new Error(
        "You're missing DREAMSTUDIO_API_KEY in your .env.local file."
      );
    }

    const { prompt } = req.query;
    console.log("prompt", prompt);

    // const api = generate({
    //   prompt: "A Stunning House",
    //   apiKey: process.env.DREAMSTUDIO_API_KEY,
    // });

    // api.on("image", ({ buffer, filePath }) => {
    //   console.log("Image", buffer, filePath);
    // });

    // api.on("end", (data) => {
    //   console.log("Generating Complete", data);
    // });

    // Return back the signedPayload to the client.
    res.status(200).json({
      signedPayload: JSON.parse(JSON.stringify("hello world")),
    });
  } catch (e) {
    res.status(500).json({ error: `Server error ${e}` });
  }
}
