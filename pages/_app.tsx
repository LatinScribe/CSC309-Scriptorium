import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider } from "@/contexts/session";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider>
      <Component {...pageProps} />
    </SessionProvider>
  );
}
