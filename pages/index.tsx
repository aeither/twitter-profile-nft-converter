import {
  MediaRenderer,
  ThirdwebNftMedia,
  useAddress,
  useContract,
  useMetamask,
  useNetwork,
  useNetworkMismatch,
  useSigner,
} from "@thirdweb-dev/react";
import {
  NFTCollection,
  NFTMetadataOwner,
  ThirdwebSDK,
} from "@thirdweb-dev/sdk";
import type { NextPage } from "next";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import StyledButton from "../components/button/StyledButton";
import Navbar from "../components/header/Navbar";
import { DESIRED_CHAIN_ID } from "../utils/constants";
import { getBuffer } from "../utils/utils";

type NftData = { id: string; metadataOwner: NFTMetadataOwner };

const Home: NextPage = () => {
  // Helpful thirdweb hooks to connect and manage the wallet from metamask.
  const address = useAddress();
  const connectWithMetamask = useMetamask();
  const signer = useSigner();
  const isOnWrongNetwork = useNetworkMismatch();
  const [, switchNetwork] = useNetwork();
  const { data: session } = useSession();
  const [isMinted, setIsMinted] = useState(false);
  const [nftData, setNftData] = useState<NftData>();
  const [isMinting, setIsMinting] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [stabilityImage, setStabilityImage] = useState<string>();

  // Fetch the NFT collection from thirdweb via it's contract address.
  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_COLLECTION_ADDRESS;
  const { contract } = useContract<NFTCollection>(CONTRACT_ADDRESS);

  const getIsMinted = async () => {
    if (contract && address) {
      const hasMinted = (await contract.balanceOf(address)).gt(0);
      setIsMinted(hasMinted);
      if (hasMinted) {
        const nfts = await contract.getOwned(address);
        const ids = await contract.getOwnedTokenIds(address);
        setNftData({
          id: ids[0].toString(),
          metadataOwner: nfts[0],
        });
      }
    }
  };
  useEffect(() => {
    getIsMinted();
  }, [contract, address]);

  // This function calls a Next JS API route that mints an NFT with signature-based minting.
  // We send in the address of the current user, and the text they entered as part of the request.
  const mintWithSignature = async () => {
    if (!address) {
      connectWithMetamask();
      return;
    }

    if (isOnWrongNetwork) {
      switchNetwork && switchNetwork(DESIRED_CHAIN_ID);
      return;
    }

    setIsMinting(true);
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

      // Use Stable Diffusion generated image uri if exist
      let url;
      if (stabilityImage) {
        url = stabilityImage;
      } else {
        // Upload image to IPFS using the sdk.storage
        const originalImage = session.user.image.replace("_normal", "");
        const imageBuffer = await getBuffer(originalImage);
        const tw = new ThirdwebSDK(signer);
        url = await tw.storage.upload(new File([imageBuffer], "image"));
      }

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
      getIsMinted();

      return nft;
    } catch (e) {
      console.error("An error occurred trying to mint the NFT:", e);
    } finally {
      setIsMinting(false);
    }
  };

  const generatePic = async () => {
    const res = await fetch(`/api/stability`, {
      method: "POST",
      body: JSON.stringify({
        prompt: prompt,
      }),
    });

    // Grab the JSON from the response
    const json = await res.json();
    console.log("Json:", json);

    // If the request failed, we'll show an error.
    if (!res.ok) {
      alert(json.error);
      return;
    }

    const uri: string = json.uri;
    setStabilityImage(uri);
  };

  const signInWithTwitter = async () => {
    signIn();
  };

  const signOutWithTwitter = async () => {
    signOut();
  };

  async function openOpensea() {
    const URL = `https://opensea.io/assets/matic/${CONTRACT_ADDRESS}/${nftData?.id}`;
    window.open(URL, "_blank");
  }

  const TwitterButton = () => {
    return (
      <>
        {session && session.user && session.user.image ? (
          <StyledButton
            callback={signOutWithTwitter}
            icon="twitter"
            isSignOut={true}
            isDisabled={isMinting}
          >
            Sign out
          </StyledButton>
        ) : (
          <StyledButton callback={signInWithTwitter} icon="twitter">
            Sign in
          </StyledButton>
        )}
      </>
    );
  };

  const ConvertButton = () => {
    if (!session) {
      return (
        <StyledButton
          callback={mintWithSignature}
          icon="convert"
          isDisabled={true}
        >
          Convert
        </StyledButton>
      );
    }

    if (isMinted) {
      return (
        <StyledButton callback={openOpensea} icon="convert">
          Opensea
        </StyledButton>
      );
    }

    return (
      <>
        {address ? (
          <StyledButton
            callback={mintWithSignature}
            icon="convert"
            isDisabled={isMinting}
          >
            {isMinting ? "Minting..." : "Convert"}
          </StyledButton>
        ) : (
          <StyledButton callback={connectWithMetamask} icon="convert">
            Connect Metamask
          </StyledButton>
        )}
      </>
    );
  };

  const Username = () => {
    return (
      <p className="mt-3 text-lg text-white">
        {session && session.user && session.user.name
          ? session.user.name
          : "Name Surname"}
      </p>
    );
  };
  const PreProfile = () => {
    return (
      <div className="flex flex-shrink-0">
        <div className="flex flex-col">
          <h2 className="bg-gradient-to-br from-pink-500 to-purple-800 bg-clip-text pb-12 text-3xl font-bold tracking-tight  text-transparent sm:text-4xl">
            1. Connect
          </h2>
          {session && session.user && session.user.image ? (
            <div className="w-full items-center py-8">
              {stabilityImage ? (
                <MediaRenderer
                  src={stabilityImage}
                  alt="image"
                  className="inline-block h-40 w-40 rounded-full bg-white ring-2 ring-pink-500 ring-offset-2 ring-offset-white"
                />
              ) : (
                <img
                  className="inline-block h-40 w-40 rounded-full bg-white ring-2 ring-pink-500 ring-offset-2 ring-offset-white"
                  src={session.user.image.replace("_normal", "")}
                  alt=""
                />
              )}
            </div>
          ) : (
            <div className="w-full items-center py-8">
              <img
                className="inline-block h-40 w-40 rounded-full ring-2 ring-white"
                src="/avatars.gif"
                alt=""
              />
            </div>
          )}
          <Username />
          <div className="pt-6">
            <TwitterButton />
          </div>
        </div>
      </div>
    );
  };

  const PostProfile = () => {
    return (
      <div className="flex flex-shrink-0">
        <div className="flex flex-col">
          <h2 className="bg-gradient-to-br from-yellow-500 to-green-800 bg-clip-text pb-12 text-3xl font-bold tracking-tight  text-transparent sm:text-4xl">
            2. Convert
          </h2>
          {isMinted && nftData ? (
            <div className="w-full items-center py-8">
              <ThirdwebNftMedia
                metadata={nftData.metadataOwner.metadata}
                className="mask mask-hexagon inline-block h-40 w-40"
              />
            </div>
          ) : (
            <div className="w-full items-center py-8">
              {stabilityImage ? (
                <div className="mask mask-hexagon h-42 w-42 bg-white">
                  <MediaRenderer
                    src={stabilityImage}
                    alt="image"
                    className="mask mask-hexagon inline-block h-40 w-40"
                  />
                </div>
              ) : (
                <div className="mask mask-hexagon h-42 w-42 bg-white">
                  <img
                    className="mask mask-hexagon inline-block h-40 w-40"
                    src="/unknown.jpg"
                    alt=""
                  />
                </div>
              )}
            </div>
          )}
          <Username />
          <div className="pt-6">
            <ConvertButton />
          </div>
        </div>
      </div>
    );
  };

  const Banner = () => {
    return (
      <div className="flex h-full w-full flex-col items-center pb-8">
        <div className="h-36 w-full rounded-lg bg-[url('/twitter-banner.jpg')] bg-cover md:w-1/2" />
      </div>
    );
  };

  return (
    <>
      {/* Header */}
      <Navbar />

      {/* Content */}
      <div className="w-[100vw] bg-neutral-medium pt-16">
        <div className="mx-auto flex h-full max-w-7xl flex-col items-center justify-center p-16 py-12 px-4 sm:px-6">
          <Banner />
          <div className="flex flex-row gap-2 bg-connect-animation bg-[length:70%_30%] bg-center bg-no-repeat sm:gap-16 md:gap-36">
            <PreProfile />
            <PostProfile />
          </div>
          <div className="mx-auto flex flex-col gap-2 pt-16">
            <div className="pb-6">
              <span className="text-sm text-slate-500">
                What if I do NOT want to use my picture?
              </span>
              <h3 className="bg-gradient-to-br from-blue-500 to-green-300 bg-clip-text text-lg font-bold  tracking-tight text-transparent">
                Generate one with AI
              </h3>
              <span className="text-slate-300">
                Describe your ideal picture as precisely as possible. 
              </span>
            </div>
            <input
              key="prompt"
              className="block w-full rounded-full border border-slate-700 bg-neutral-dark px-6 py-4 shadow-sm placeholder:italic placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-pink-500 sm:text-sm"
              placeholder="lens flare, studio quality, futuristic, mars, ski goggles, sharp focus, galactic powerful suit, elegant, 4K, cinematic, dramatic atmosphere"
              type="text"
              name="search"
              onChange={(e) => setPrompt(e.target.value)}
              value={prompt}
            />
            <div className="pt-6">
              <StyledButton
                callback={generatePic}
                icon="convert"
                isDisabled={session ? false : true}
              >
                Generate
              </StyledButton>
            </div>
            <span className="text-sm text-slate-500">
              *Sign out and sign in again to use your Twitter pic again.
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
