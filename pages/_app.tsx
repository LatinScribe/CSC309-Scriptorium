import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider } from "@/contexts/session";
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import '@/themes/prism-material-light.css' ;


export default function App({ Component, pageProps }: AppProps) {

  return (
    <SessionProvider>
      <ThemeProvider 
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <Component {...pageProps} />
        <Toaster />
      </ThemeProvider>
    </SessionProvider>
  );
}
