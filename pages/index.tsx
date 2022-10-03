import {
  ConnectWallet,
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
import { signIn, signOut, useSession } from "next-auth/react";
import styles from "./styles/Home.module.css";
import { SiTwitter } from "react-icons/si";
import { BsFillLightningChargeFill } from "react-icons/bs";

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

  const TwitterButton = () => {
    return (
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

        <div className="inline-flex items-center">
          <SiTwitter />
          <span className="relative pl-4">Sign in</span>
        </div>
      </a>
    );
  };
  const ConvertButton = () => {
    return (
      <a
        onClick={mintWithSignature}
        className="group relative inline-flex animate-pulse cursor-pointer items-center justify-center overflow-hidden rounded-full px-6 py-3 font-bold text-white shadow-2xl"
      >
        <span className="absolute inset-0 h-full w-full bg-gradient-to-br from-pink-600 via-purple-700 to-blue-400 opacity-0 transition duration-300 ease-out group-hover:opacity-100"></span>
        <span className="absolute top-0 left-0 h-1/3 w-full bg-gradient-to-b from-white to-transparent opacity-5"></span>
        <span className="absolute bottom-0 left-0 h-1/3 w-full bg-gradient-to-t from-white to-transparent opacity-5"></span>
        <span className="absolute bottom-0 left-0 h-full w-4 bg-gradient-to-r from-white to-transparent opacity-5"></span>
        <span className="absolute bottom-0 right-0 h-full w-4 bg-gradient-to-l from-white to-transparent opacity-5"></span>
        <span className="absolute inset-0 h-full w-full rounded-md border border-white opacity-10"></span>
        <span className="absolute h-0 w-0 rounded-full bg-white opacity-5 transition-all duration-300 ease-out group-hover:h-56 group-hover:w-56"></span>

        <div className="inline-flex items-center">
          <BsFillLightningChargeFill />
          <span className="relative pl-4">Convert</span>
        </div>
      </a>
    );
  };

  const Username = () => {
    return (
      <p className="mt-3 text-lg text-white">
        {session && session.user && session.user.name
          ? session.user.name
          : "Your name"}
      </p>
    );
  };

  return (
    <>
      {/* Header */}
      <nav className="fixed top-0 w-screen bg-neutral-dark">
        <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
          <div className="relative flex h-16 items-center justify-between">
            <div className="flex flex-1 items-center justify-between sm:items-stretch ">
              <div className="flex flex-shrink-0 items-center">
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

              <div>
                <ConnectWallet />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="h-[100vh] bg-neutral-medium pt-16">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-center  p-16 py-12 px-4 sm:px-6">
          <div className="flex flex-row gap-36 bg-connect-animation bg-[length:70%_30%] bg-center bg-no-repeat">
            <div className="flex flex-shrink-0">
              <div className="flex flex-col">
                <h2 className=" bg-gradient-to-br from-pink-500 to-purple-800 bg-clip-text pb-12 text-3xl font-bold tracking-tight  text-transparent sm:text-4xl">
                  1. Connect
                </h2>
                <div className="w-full items-center py-8">
                  <img
                    className="inline-block h-40 w-40 rounded-full ring-2 ring-white"
                    src="https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                    alt=""
                  />
                </div>
                <Username />
                <div className="pt-6">
                  <TwitterButton />
                  <a className={styles.mainButton} onClick={() => signOut()}>
                    Sign out
                  </a>
                </div>
              </div>
            </div>
            <div className="flex flex-shrink-0">
              <div className="flex flex-col">
                <h2 className=" bg-gradient-to-br from-yellow-500 to-green-800 bg-clip-text pb-12 text-3xl font-bold tracking-tight  text-transparent sm:text-4xl">
                  2. Convert
                </h2>
                <div className="w-full items-center py-8">
                  <img
                    className="inline-block h-40 w-40 rounded-full ring-2 ring-white"
                    src="https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                    alt=""
                  />
                </div>
                <Username />

                <div className="pt-6">
                  {address ? (
                    <ConvertButton />
                  ) : (
                    <a
                      className={styles.mainButton}
                      onClick={connectWithMetamask}
                    >
                      Connect Wallet
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.container}>
        {/* Twitter */}
        <h1 className={styles.h1}>Twitter</h1>
        <button onClick={getSes}>getSes</button>
        <a className={styles.mainButton} onClick={signInWithTwitter}>
          signInWithTwitter
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
