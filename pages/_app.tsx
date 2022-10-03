import { ThirdwebProvider } from "@thirdweb-dev/react";
import { SessionProvider } from "next-auth/react";
import type { AppProps as NextAppProps } from "next/app";
import Head from "next/head";
import ThirdwebGuideFooter from "../components/guide/ThirdwebGuideFooter";
import "./styles/globals.css";
import { DESIRED_CHAIN_ID } from "../utils/constants";

type AppProps<P = any> = {
  pageProps: P;
} & Omit<NextAppProps<P>, "pageProps">;

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <ThirdwebProvider desiredChainId={DESIRED_CHAIN_ID}>
        <Head>
          <title>Twitter profile NFT converter</title>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <meta
            name="description"
            content="thirdweb Example Repository to Showcase Twitter profile NFT converter"
          />
          <meta name="keywords" content="Twitter profile NFT converter" />
        </Head>
        <Component {...pageProps} />
        <ThirdwebGuideFooter />
      </ThirdwebProvider>
    </SessionProvider>
  );
}

export default MyApp;
