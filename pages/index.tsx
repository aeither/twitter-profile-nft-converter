import {
  ConnectWallet,
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
import axios from "axios";
import type { NextPage } from "next";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import StyledButton from "../components/button/StyledButton";
import { DESIRED_CHAIN_ID } from "../utils/constants";

type NftData = { id: string; metadataOwner: NFTMetadataOwner };

function getBuffer(url: string) {
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
  const signer = useSigner();
  const isOnWrongNetwork = useNetworkMismatch();
  const [, switchNetwork] = useNetwork();
  const { data: session } = useSession();
  const [isMinted, setIsMinted] = useState(false);
  const [nftData, setNftData] = useState<NftData>();
  const [isMinting, setIsMinting] = useState(false);

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

      // Upload image to IPFS using the sdk.storage
      const imageData = await getBuffer(session.user.image);
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
      getIsMinted();

      return nft;
    } catch (e) {
      console.error("An error occurred trying to mint the NFT:", e);
    } finally {
      setIsMinting(false);
    }
  };

  async function signInWithTwitter() {
    signIn();
  }

  async function signOutWithTwitter() {
    signOut();
  }

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
    if (isMinted) {
      return (
        <>
          <StyledButton callback={openOpensea} icon="convert">
            Opensea
          </StyledButton>
        </>
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
      <>
        <h2 className="bg-gradient-to-br from-pink-500 to-purple-800 bg-clip-text pb-12 text-3xl font-bold tracking-tight  text-transparent sm:text-4xl">
          1. Connect
        </h2>
        {session && session.user && session.user.image ? (
          <div className="w-full items-center py-8">
            <img
              className="inline-block h-40 w-40 rounded-full ring-2 ring-pink-500 ring-offset-2 ring-offset-white"
              src={session.user.image}
              alt=""
            />
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
      </>
    );
  };

  const PostProfile = () => {
    return (
      <>
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
            <img
              className="mask mask-hexagon inline-block h-40 w-40"
              src="/unknown.jpg"
              alt=""
            />
          </div>
        )}

        <Username />

        <div className="pt-6">
          {session && session.user && session.user.image ? (
            <ConvertButton />
          ) : (
            <StyledButton
              callback={mintWithSignature}
              icon="convert"
              isDisabled={true}
            >
              Convert
            </StyledButton>
          )}
        </div>
      </>
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
      <div className="h-[100vh] w-[100vw] bg-neutral-medium pt-16">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-center  p-16 py-12 px-4 sm:px-6">
          <div className="flex flex-row gap-2 bg-connect-animation bg-[length:70%_30%] bg-center bg-no-repeat md:gap-36">
            <div className="flex flex-shrink-0">
              <div className="flex flex-col">
                <PreProfile />
              </div>
            </div>
            <div className="flex flex-shrink-0">
              <div className="flex flex-col">
                <PostProfile />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
