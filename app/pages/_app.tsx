import { ChakraProvider } from "@chakra-ui/react";
import type { AppProps } from "next/app";
import WalletContextProvider from "../contexts/WalletContextProvider";
import { MinterProgramProvider } from "@/contexts/MinterProgramContextProvider";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider>
      <WalletContextProvider>
        <MinterProgramProvider>
          <Component {...pageProps} />
          </MinterProgramProvider>
      </WalletContextProvider>    
    </ChakraProvider>
  );
}
