import { ThirdwebStorage } from "@thirdweb-dev/storage";
import type { NextApiRequest, NextApiResponse } from "next";
import { generate } from "stability-client";
import "../styles/globals.css";

export default async function server(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { prompt } = JSON.parse(req.body);

    const promise: Promise<Buffer> = new Promise((resolve) => {
      if (!process.env.DREAMSTUDIO_API_KEY) {
        throw new Error(
          "You're missing DREAMSTUDIO_API_KEY in your .env.local file."
        );
      }
      const api = generate({
        prompt: prompt,
        apiKey: process.env.DREAMSTUDIO_API_KEY,
        outDir: "/tmp/",
      });
      api.on("image", ({ buffer, filePath }) => {
        console.log("Image", buffer, filePath);
        resolve(buffer);
      });
    });
    const imageBuffer = await promise;

    // Upload image buffer to ipfs
    const storage = new ThirdwebStorage();
    const uri = await storage.upload(imageBuffer);
    console.log(uri);

    res.status(200).json({
      uri,
    });
  } catch (e) {
    res.status(500).json({ error: `Server error ${e}` });
  }
}
