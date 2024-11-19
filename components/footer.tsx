export default function Footer() {
    // get current year
    const year = new Date().getFullYear();
    return (
        <footer className="flex items-center justify-center h-16 bg-primary gap-10">
        <div className="text-buttontext">{year} © Scriptorium</div>
        <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" className="text-buttontext">Privacy</a>
        </footer>
    );
}