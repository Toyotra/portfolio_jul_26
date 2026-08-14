import { useState } from "react";
import "./App.css";
import BinaryBackground from "./BinaryBackground";

const sections = {
  home: {
    title: "Home",
    content: (
      <div>
        <h2>Welcome</h2>
        <p>This is the home section. Each button reveals a different set of content below.</p>
      </div>
    )
  },
  about: {
    title: "About Me",
    content: (
      <div>
        <h2>About Me</h2>
        <p>I am a developer passionate about building clean, maintainable software.</p>
      </div>
    )
  },
  experience: {
    title: "Experience",
    content: (
      <div>
        <h2>Experience</h2>
        <p>Senior Engineer at Example Corp — building products from 2020 to present.</p>
      </div>
    )
  },
  projects: {
    title: "Projects",
    content: (
      <div>
        <h2>Projects</h2>
        <p>Portfolio, CLI tools, and full-stack web apps.</p>
      </div>
    )
  },
  contact: {
    title: "Contact",
    content: (
      <div>
        <h2>Contact</h2>
        <p>Email: hello@example.com</p>
      </div>
    )
  }
};

function App (){
  const [activeSection, setActiveSection] = useState("home");

  return(
    <>
      <BinaryBackground />
      <div className = "bodyContainerA">
        <div className = "bodyContainerB">
          <nav className="navbar">
            <ul className="navLinks">
              {Object.keys(sections).map((key) => (
                <li key={key}>
                  <button
                    onClick={() => setActiveSection(key)}
                  >
                    {sections[key].title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <main>
            {sections[activeSection].content}
          </main>

        </div>
      </div>
    </>
    )
}

export default App;