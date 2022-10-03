import React from "react";
import type { AppProps as NextAppProps } from "next/app";
import { ChainId, ThirdwebProvider } from "@thirdweb-dev/react";
import Head from "next/head";
import ThirdwebGuideFooter from "../components/guide/ThirdwebGuideFooter";
import { SessionProvider } from "next-auth/react";
import "./styles/globals.css";

// This is the chainId your dApp will work on.
const activeChainId = ChainId.Mumbai;

type AppProps<P = any> = {
  pageProps: P;
} & Omit<NextAppProps<P>, "pageProps">;

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <ThirdwebProvider desiredChainId={activeChainId}>
        <Head>
          <title>thirdweb Signature Based Minting</title>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <meta
            name="description"
            content="thirdweb Example Repository to Showcase signature based minting on an NFT Collection contract"
          />
          <meta name="keywords" content="thirdweb signature based minting" />
        </Head>
        <Component {...pageProps} />
        <ThirdwebGuideFooter />
      </ThirdwebProvider>
    </SessionProvider>
  );
}

export default MyApp;
