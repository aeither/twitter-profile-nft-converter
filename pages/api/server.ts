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
    // De-structure the arguments we passed in out of the request body
    const { authorAddress, nftName, imagePath } = JSON.parse(req.body);

    // You'll need to add your private key in a .env.local file in the root of your project
    // !!!!! NOTE !!!!! NEVER LEAK YOUR PRIVATE KEY to anyone!
    if (!process.env.PRIVATE_KEY) {
      throw new Error("You're missing PRIVATE_KEY in your .env.local file.");
    }

    // Initialize the Thirdweb SDK on the serverside
    const sdk = ThirdwebSDK.fromPrivateKey(
      // Your wallet private key (read it in from .env.local file)
      process.env.PRIVATE_KEY as string,
      DESIRED_CHAIN_NAME
    );

    // Load the NFT Collection via it's contract address using the SDK
    const nftCollection = await sdk.getNFTCollection(
      // Replace this with your NFT Collection contract address
      process.env.NEXT_PUBLIC_NFT_COLLECTION_ADDRESS as string
    );

    // Check that this wallet hasn't already minted a page - 1 NFT per wallet
    const hasMinted = (await nftCollection.balanceOf(authorAddress)).gt(0);
    if (hasMinted) {
      res.status(400).json({ error: "Already minted" });
      return;
    }

    // If all the checks pass, begin generating the signature...
    const secret = process.env.NEXTAUTH_SECRET;
    const token = await getToken({
      req,
      secret,
    });
    const profileInfo: ProfileInfo = await fetch(
      "https://api.twitter.com/2/users/me?user.fields=description,url,username",
      {
        headers: new Headers({
          Authorization: `Bearer ${token?.accessToken}`,
        }),
      }
    )
      .then((res) => res.json())
      .then((res) => res.data);

    // Generate the signature for the page NFT
    const signedPayload = await nftCollection.signature.generate({
      to: authorAddress,
      metadata: {
        name: nftName as string,
        image: imagePath as string,
        description: profileInfo.description,
        properties: {
          username: profileInfo.username,
          link: profileInfo.url,
        },
      },
    });

    // Return back the signedPayload to the client.
    res.status(200).json({
      signedPayload: JSON.parse(JSON.stringify(signedPayload)),
    });
  } catch (e) {
    res.status(500).json({ error: `Server error ${e}` });
  }
}
