export default function Footer() {
    // get current year
    const year = new Date().getFullYear();
    return (
        <footer className="flex items-center justify-center h-16 bg-background gap-10">
        <div className="text-white">{year} © Scriptorium</div>
        <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" className="text-white">Privacy</a>
        </footer>
    );
}