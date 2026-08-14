import { Routes, Route } from "react-router-dom";
import "./App.css";
import BinaryBackground from "./BinaryBackground";
import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import About from "./pages/About";
import Experience from "./pages/Experience";
import Projects from "./pages/Projects";
import Contact from "./pages/Contact";

function App() {
  return (
    <>
      <BinaryBackground />
      <div className="bodyContainerA">
        <div className="bodyContainerB">
          <NavBar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/experience" element={<Experience />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </main>
        </div>
      </div>
    </>
  );
}

export default App;
