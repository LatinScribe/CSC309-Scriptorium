import Image from "next/image";
import localFont from "next/font/local";
import NavBar from "@/components/navbar";
import { SessionContext } from "@/contexts/session";
import React, { useEffect, useContext } from "react";
import { fetchTemplates } from "@/utils/dataInterface";
import WelcomePage from "@/components/pages/welcome";
import LoginPage from "@/components/pages/login";
import BlogsPage from "@/components/pages/blogs";
import TemplatesPage from "@/components/pages/templates";
import { useRouter } from "next/router";
import { useState } from "react";
import Footer from "@/components/footer";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function Home() {
  const { session } = useContext(SessionContext);
  const router = useRouter();
  const [currentPath, setCurrentPath] = useState("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
      setIsClient(true);
  }, []);

  useEffect(() => {
    setCurrentPath(router.asPath);
  }, [router.asPath]);

  if (!isClient) {
      return null;
  }


  const renderPage = () => {
    switch (router.asPath) { // Use asPath instead of pathname
      case "/login":
        return <LoginPage />;
      case "/blogs":
        return <BlogsPage />;
      case "/templates":
        return <TemplatesPage />;
      default:
        if (!session) {
          // not logged in
          return <WelcomePage />;
        }
        return <WelcomePage />;
    }
  };

  return (
    <>
      <NavBar />
      {renderPage()}
      <Footer />
    </>
  );
}