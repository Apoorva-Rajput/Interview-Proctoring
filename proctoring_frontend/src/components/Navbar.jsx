import React from "react";
import { Link } from "react-router-dom";
import './Navbar.css';
// import Interviewer from "./Interviewer";

function Navbar() {
    return (
        <nav className="navbar">
            <h1>My App</h1>
            <ul>
                <li><Link to="/Interviewer">Interviewer Window</Link></li>
                <li><Link to="/Interviewee">Interviewee Window</Link></li>
            </ul>
        </nav>
    );
}

export default Navbar;