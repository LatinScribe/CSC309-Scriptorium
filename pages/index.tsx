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
import TemplatePage from "@/components/pages/template";
import PlaygroundPage from "@/components/pages/playground";
import { useRouter } from "next/router";
import { useState } from "react";
import Footer from "@/components/footer";
import { ThemeProvider } from "next-themes";
import Custom404 from "@/components/pages/404";
import MyTemplatesPage from "@/components/pages/mytemplates";

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
      case "/":
        return <WelcomePage />;
      case "/login":
        return <LoginPage />;
      case "/blogs":
        return <BlogsPage />;
      case "/templates":
        return <TemplatesPage />;
      case "/playground":
        return <PlaygroundPage />;
      case "/my-templates":
        return <MyTemplatesPage />;
      default:
        if (router.asPath.startsWith("/templates?")) {
          return <TemplatesPage />;
        }
        if (router.asPath.startsWith("/my-templates?")) {
          return <MyTemplatesPage />;
        }
        if (router.asPath.startsWith("/templates/")) {
          return <TemplatePage />;
        }
        return <Custom404 />;
    }
  };

  return (
    <div className={`${geistSans.variable} ${geistMono.variable} font-sans bg-background text-foreground`}>
      <main className="min-h-screen flex flex-col">
        <NavBar />
        <div className="flex-grow">
          {renderPage()}
        </div>
        <Footer />
      </main>
    </div>
  );
}