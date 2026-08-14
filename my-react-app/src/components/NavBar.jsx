import React from "react";
import { Link } from "react-router-dom";

export default function NavBar() {
  return (
    <nav className="navbar">
        <div style={{  color:"white", fontSize:'10px', width:"200px" }}>Jad Menkara</div>
        <Link to="/" className="linkButton" data-hover="home" >home</Link>
        <Link to="/about" className="linkButton" data-hover="about">About</Link>
        <Link to="/projects" className="linkButton" data-hover="projects">Projects</Link>
        <Link to="/contact" className="linkButton" data-hover="contact">Contact</Link>
    </nav>
  );
}
