import {
  ThirdwebNftMedia,
  useAddress,
  useContract,
  useDisconnect,
  useMetamask,
  useNetwork,
  useNetworkMismatch,
  useNFTs,
  useSigner,
} from "@thirdweb-dev/react";
import { ChainId, NFTCollection, ThirdwebSDK } from "@thirdweb-dev/sdk";
import axios from "axios";
import type { NextPage } from "next";
import { signIn, signOut, useSession, getSession } from "next-auth/react";
import { useRef, useState } from "react";
import styles from "./styles/Home.module.css";

function getBase64(url: string) {
  return axios
    .get(url, {
      responseType: "arraybuffer",
    })
    .then((response: any) => Buffer.from(response.data, "binary"));
}

const Home: NextPage = () => {
  // Helpful thirdweb hooks to connect and manage the wallet from metamask.
  const address = useAddress();
  const connectWithMetamask = useMetamask();
  const disconnectWallet = useDisconnect();
  const signer = useSigner();
  const isOnWrongNetwork = useNetworkMismatch();
  const [, switchNetwork] = useNetwork();
  const { data: session, status } = useSession();

  // Fetch the NFT collection from thirdweb via it's contract address.
  const { contract } = useContract<NFTCollection>(
    process.env.NEXT_PUBLIC_NFT_COLLECTION_ADDRESS
  );

  const { data: nfts, isLoading: loadingNfts } = useNFTs(contract);

  // This function calls a Next JS API route that mints an NFT with signature-based minting.
  // We send in the address of the current user, and the text they entered as part of the request.
  const mintWithSignature = async () => {
    if (!address) {
      connectWithMetamask();
      return;
    }

    if (isOnWrongNetwork) {
      switchNetwork && switchNetwork(ChainId.Mumbai);
      return;
    }

    try {
      if (
        !session ||
        !session.user ||
        !session.user.image ||
        !session.user.name
      ) {
        alert("Please enter a name and upload a file.");
        return;
      }

      if (!address || !signer) {
        alert("Please connect to your wallet.");
        return;
      }

      // Upload image to IPFS using the sdk.storage
      const imageData = await getBase64(session.user.image);
      const tw = new ThirdwebSDK(signer);
      const url = await tw.storage.upload(new File([imageData], "image"));

      // Make a request to /api/server
      const signedPayloadReq = await fetch(`/api/server`, {
        method: "POST",
        body: JSON.stringify({
          authorAddress: address, // Address of the current user
          nftName: session.user.name,
          imagePath: url,
        }),
      });

      console.log("Received Signed payload", signedPayloadReq);

      // Grab the JSON from the response
      const json = await signedPayloadReq.json();

      console.log("Json:", json);

      // If the request failed, we'll show an error.
      if (!signedPayloadReq.ok) {
        alert(json.error);
        return;
      }

      // If the request succeeded, we'll get the signed payload from the response.
      // The API should come back with a JSON object containing a field called signedPayload.
      // This line of code will parse the response and store it in a variable called signedPayload.
      const signedPayload = json.signedPayload;

      // Now we can call signature.mint and pass in the signed payload that we received from the server.
      // This means we provided a signature for the user to mint an NFT with.
      const nft = await contract?.signature.mint(signedPayload);

      console.log("Successfully minted NFT with signature", nft);

      alert("Successfully minted NFT with signature");

      return nft;
    } catch (e) {
      console.error("An error occurred trying to mint the NFT:", e);
    }
  };

  async function signInWithTwitter() {
    signIn();
  }

  const getSes = async () => {
    if (session?.accessToken) {
      console.log("we have access token");
    }
    console.log("we don't have");
  };

  return (
    <>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.left}>
          <div>
            <a
              href="https://thirdweb.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={`/logo.png`} alt="Thirdweb Logo" width={135} />
            </a>
          </div>
        </div>
        <div className={styles.right}>
          {address ? (
            <>
              <a
                className={styles.secondaryButton}
                onClick={() => disconnectWallet()}
              >
                Disconnect Wallet
              </a>
              <p style={{ marginLeft: 8, marginRight: 8, color: "grey" }}>|</p>
              <p>
                {address.slice(0, 6).concat("...").concat(address.slice(-4))}
              </p>
            </>
          ) : (
            <a
              className={styles.mainButton}
              onClick={() => connectWithMetamask()}
            >
              Connect Wallet
            </a>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={styles.container}>
        {/* Twitter */}
        <h1 className={styles.h1}>Twitter</h1>
        <button onClick={getSes}>getSes</button>
        <a className={styles.mainButton} onClick={signInWithTwitter}>
          signInWithTwitter
        </a>
        <a
          onClick={signInWithTwitter}
          className="group relative inline-flex animate-pulse cursor-pointer items-center justify-center overflow-hidden rounded-full px-6 py-3 font-bold text-white shadow-2xl"
        >
          <span className="absolute inset-0 h-full w-full bg-gradient-to-br from-pink-600 via-purple-700 to-blue-400 opacity-0 transition duration-300 ease-out group-hover:opacity-100"></span>
          <span className="absolute top-0 left-0 h-1/3 w-full bg-gradient-to-b from-white to-transparent opacity-5"></span>
          <span className="absolute bottom-0 left-0 h-1/3 w-full bg-gradient-to-t from-white to-transparent opacity-5"></span>
          <span className="absolute bottom-0 left-0 h-full w-4 bg-gradient-to-r from-white to-transparent opacity-5"></span>
          <span className="absolute bottom-0 right-0 h-full w-4 bg-gradient-to-l from-white to-transparent opacity-5"></span>
          <span className="absolute inset-0 h-full w-full rounded-md border border-white opacity-10"></span>
          <span className="absolute h-0 w-0 rounded-full bg-white opacity-5 transition-all duration-300 ease-out group-hover:h-56 group-hover:w-56"></span>
          <span className="relative">Do nothing</span>
        </a>

        <h3 className="mt-3 text-lg text-white">
          Welcome {session && session.user && session.user.name}
        </h3>
        <h3 className="mt-3 text-lg text-white">
          You are signed in as {session && session.user && session.user.email}
        </h3>
        <a className={styles.mainButton} onClick={() => console.log(session)}>
          Log session
        </a>
        <a className={styles.mainButton} onClick={() => signOut()}>
          Sign out
        </a>
        {/* Top Section */}

        <hr className={styles.divider} />

        <div style={{ marginTop: 24 }}>
          {address ? (
            <a className={styles.mainButton} onClick={mintWithSignature}>
              Mint NFT
            </a>
          ) : (
            <a className={styles.mainButton} onClick={connectWithMetamask}>
              Connect Wallet
            </a>
          )}
        </div>
        <hr className={styles.smallDivider} />
        <div className={styles.collectionContainer}>
          <h2 className={styles.ourCollection}>
            Other NFTs in this collection:
          </h2>

          {loadingNfts ? (
            <p>Loading...</p>
          ) : (
            <div className={styles.nftGrid}>
              {nfts?.map((nft) => (
                <div
                  className={styles.nftItem}
                  key={nft.metadata.id.toString()}
                >
                  <div>
                    <ThirdwebNftMedia
                      metadata={nft.metadata}
                      style={{
                        height: 90,
                        borderRadius: 16,
                      }}
                    />
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p>Named</p>
                    <p>
                      <b>{nft.metadata.name}</b>
                    </p>
                  </div>

                  <div style={{ textAlign: "center" }}>
                    <p>Owned by</p>
                    <p>
                      <b>
                        {nft.owner
                          .slice(0, 6)
                          .concat("...")
                          .concat(nft.owner.slice(-4))}
                      </b>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Home;
