//import { useRouter } from "next/router";

export default function Footer() {
    // get current year
    const year = new Date().getFullYear();
    //const router = useRouter();

    // function handleAbout() {
    //     router.push("/about-us");
    // }

    return (
        <footer className="flex items-center justify-center h-16 bg-background gap-10">
        <div className="text-white">{year} © Scriptorium</div>
        <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" className="text-white">Privacy</a>
        <a href="/about-us" className="text-white">About Us</a>
        </footer>
    );
}