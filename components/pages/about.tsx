import React from "react";

export default function About() {
    return (
        <div style={{ padding: "20px" }}>
            <h1 style={{ margin: "20px 0" }}>This Project</h1>
            <p style={{ margin: "15px 0", lineHeight: "1.6" }}>
                An online platform where you can write, execute, and share code in multiple programming languages (you can easily support more languages in your own deployment). Inspired by the ancient concept of a scriptorium, a place where manuscripts were crafted and preserved, Scriptorium modernizes this idea for the digital age. It offers a secure environment for geeks, nerds, and coding enthusiasts to experiment, refine, and save their work as reusable templates. Whether you’re testing a quick snippet or building a reusable code example, Scriptorium is what you need to bring your ideas to life.
            </p>
            <p style={{ margin: "15px 0", lineHeight: "1.6" }}>
                This project was developed by students at the University of Toronto!
            </p>

            <p style={{ margin: "15px 0", lineHeight: "1.6" }}> 
                Publicly available at Github: <a href="https://github.com/LatinScribe/CSC309-Scriptorium" style={{ color: "#0070f3", textDecoration: "none" }}>https://github.com/LatinScribe/CSC309-Scriptorium</a>
            </p>

            <hr style={{ margin: "20px 0" }} />

            <h1 style={{ margin: "20px 0" }}>Meet the Team!</h1>
            <div className="bio" style={{ padding: "10px" }}>
                <h2 style={{ margin: "15px 0" }}>Henry "TJ" Chen</h2>
                <img src="https://www.henrytchen.com/images/Profile3_compressed.jpg" alt="Photo of Henry" style={{ width: "200px", height: "auto" }} />
                <p>Hometown: Ottawa</p>
                <p>Favorite Hobby: Playing Go (the board game)</p>
                <p>Website: <a href="https://www.henrytchen.com">https://www.henrytchen.com</a></p>
            </div>
            <div className="bio" style={{ padding: "10px" }}>
                <h2 style={{ margin: "15px 0" }}>York Ng</h2>
                <img src="https://private-avatars.githubusercontent.com/u/46370061?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTEiLCJleHAiOjE3MzQ2NDI2NjAsIm5iZiI6MTczNDY0MTQ2MCwicGF0aCI6Ii91LzQ2MzcwMDYxIn0.0luxmsR9zLQULrqDycvuFRq3mtZmMte1lEWIhJcEbfk&v=4" alt="Placeholder portrait of York" style={{ width: "200px", height: "auto" }} />
                <p>Bio for developer 2...</p>
            </div>
            <div className="bio" style={{ padding: "10px" }}>
                <h2 style={{ margin: "15px 0" }}>Alyssa Lu</h2>
                <img src="/penguin.png" alt="Placeholder portrait of Alyssa" style={{ width: "200px", height: "auto" }} />
                <p>Bio for developer 3...</p>
            </div>
        </div>
    );
}
