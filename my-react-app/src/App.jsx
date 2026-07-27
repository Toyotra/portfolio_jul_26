import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import "./App.css";

const SECTION_ORDER = ["home", "about_me", "experiences", "projects", "resume", "contact"];

const SKILLS = [
  { name: "React", logo: "⚛️" },
  { name: "Node.js", logo: "🟢" },
  { name: "TypeScript", logo: "📘" },
  { name: "Python", logo: "🐍" },
  { name: "Docker", logo: "🐳" },
  { name: "GraphQL", logo: "◈" },
  { name: "PostgreSQL", logo: "🐘" },
  { name: "Tailwind", logo: "💨" },
  { name: "Git", logo: "📦" },
  { name: "AWS", logo: "☁️" },
  { name: "Kubernetes", logo: "⚙️" },
  { name: "Figma", logo: "🎨" },
];

const PROJECTS = [
  {
    id: "flux-dashboard",
    title: "Flux Dashboard",
    description: "Real-time analytics dashboard with live data streams and interactive charts built with React + D3.",
    thumbnail: "https://picsum.photos/seed/flux/400/300",
    skills: ["React", "D3.js", "Node.js", "WebSocket"],
    images: [
      { src: "https://picsum.photos/seed/flux1/800/500", caption: "Dashboard overview with real-time metrics" },
      { src: "https://picsum.photos/seed/flux2/800/500", caption: "Interactive chart components" },
      { src: "https://picsum.photos/seed/flux3/800/500", caption: "Data stream visualization" },
    ],
  },
  {
    id: "nexus-api",
    title: "Nexus API",
    description: "High-throughput microservice gateway with auto-scaling, caching, and GraphQL federation.",
    thumbnail: "https://picsum.photos/seed/nexus/400/300",
    skills: ["Node.js", "GraphQL", "Docker", "Kubernetes"],
    images: [
      { src: "https://picsum.photos/seed/nexus1/800/500", caption: "API gateway architecture diagram" },
      { src: "https://picsum.photos/seed/nexus2/800/500", caption: "Performance monitoring dashboard" },
      { src: "https://picsum.photos/seed/nexus3/800/500", caption: "Auto-scaling configuration" },
    ],
  },
  {
    id: "cloudsync",
    title: "CloudSync",
    description: "Cross-platform file synchronization tool with end-to-end encryption and offline support.",
    thumbnail: "https://picsum.photos/seed/cloud/400/300",
    skills: ["React", "Node.js", "PostgreSQL", "AWS"],
    images: [
      { src: "https://picsum.photos/seed/cloud1/800/500", caption: "File sync across devices" },
      { src: "https://picsum.photos/seed/cloud2/800/500", caption: "End-to-end encryption flow" },
    ],
  },
  {
    id: "robot-arm",
    title: "Robotic Arm",
    description: "Arduino-controlled robotic arm with computer vision for object manipulation and sorting.",
    thumbnail: "https://picsum.photos/seed/robot/400/300",
    skills: ["Python", "Arduino", "OpenCV", "ROS"],
    images: [
      { src: "https://picsum.photos/seed/robot1/800/500", caption: "Robotic arm prototype" },
      { src: "https://picsum.photos/seed/robot2/800/500", caption: "Computer vision setup" },
    ],
  },
  {
    id: "hackathon-platform",
    title: "HackHub",
    description: "Platform for organizing and managing hackathons with team matching and project submissions.",
    thumbnail: "https://picsum.photos/seed/hackhub/400/300",
    skills: ["React", "TypeScript", "Node.js", "PostgreSQL"],
    images: [
      { src: "https://picsum.photos/seed/hackhub1/800/500", caption: "Hackathon dashboard" },
      { src: "https://picsum.photos/seed/hackhub2/800/500", caption: "Team matching interface" },
    ],
  },
  {
    id: "ai-chatbot",
    title: "AI Study Buddy",
    description: "Intelligent chatbot for students with flashcard generation and spaced repetition learning.",
    thumbnail: "https://picsum.photos/seed/aibot/400/300",
    skills: ["Python", "React", "OpenAI API", "MongoDB"],
    images: [
      { src: "https://picsum.photos/seed/aibot1/800/500", caption: "Chat interface" },
      { src: "https://picsum.photos/seed/aibot2/800/500", caption: "Flashcard generator" },
    ],
  },
];

const EXPERIENCES = [
  {
    id: "techcorp",
    title: "Senior Developer",
    company: "TechCorp",
    dates: "2023 – Present",
    description: "Leading full-stack development for a SaaS platform serving 50k+ users.",
    details: "Architected microservices infrastructure reducing latency by 40%. Led a team of 5 developers, implemented CI/CD pipelines, and established code review practices.",
    image: "https://picsum.photos/seed/techcorp/600/400",
    skills: ["React", "TypeScript", "Node.js", "AWS", "Docker"],
    images: [
      { src: "https://picsum.photos/seed/techcorp1/800/500", caption: "Microservices architecture overview" },
      { src: "https://picsum.photos/seed/techcorp2/800/500", caption: "CI/CD pipeline setup" },
    ],
  },
  {
    id: "startupx",
    title: "Full-Stack Developer",
    company: "StartupX",
    dates: "2021 – 2023",
    description: "Built and scaled multiple products from 0 to 1 in a fast-paced startup environment.",
    details: "Developed MVP for mobile app with 10k+ downloads. Built real-time features using WebSockets, designed RESTful APIs, and optimized database queries.",
    image: "https://picsum.photos/seed/startupx/600/400",
    skills: ["React", "Node.js", "GraphQL", "PostgreSQL"],
    images: [
      { src: "https://picsum.photos/seed/startupx1/800/500", caption: "Mobile app MVP interface" },
      { src: "https://picsum.photos/seed/startupx2/800/500", caption: "Real-time WebSocket implementation" },
    ],
  },
  {
    id: "webagency",
    title: "Junior Developer",
    company: "WebAgency",
    dates: "2019 – 2021",
    description: "Developed responsive web applications and e-commerce solutions for diverse clients.",
    details: "Created 20+ responsive websites using React and Node.js. Integrated payment gateways, CMS systems, and analytics tools for small to medium businesses.",
    image: "https://picsum.photos/seed/webagency/600/400",
    skills: ["React", "Node.js", "PostgreSQL", "Docker"],
    images: [
      { src: "https://picsum.photos/seed/webagency1/800/500", caption: "E-commerce platform built for retail client" },
      { src: "https://picsum.photos/seed/webagency2/800/500", caption: "CMS integration dashboard" },
    ],
  },
  {
    id: "freelance",
    title: "Freelance Developer",
    company: "Self-Employed",
    dates: "2018 – 2019",
    description: "Built custom websites and applications for local businesses and startups.",
    details: "Delivered 15+ projects ranging from portfolio sites to full-stack web apps. Managed client relationships, requirements gathering, and deployment.",
    image: "https://picsum.photos/seed/freelance/600/400",
    skills: ["React", "Node.js", "MongoDB", "Tailwind"],
    images: [
      { src: "https://picsum.photos/seed/freelance1/800/500", caption: "Client website project" },
    ],
  },
];

function App() {
  const [activeSection, setActiveSection] = useState("home");
  const [renderSection, setRenderSection] = useState("home");
  const [expandedProject, setExpandedProject] = useState(null);
  const [expandedExperience, setExpandedExperience] = useState(null);
  const isTransitioning = useRef(false);
  const currentIndex = useRef(0);
  const progress = useMotionValue(0);

  const y = useTransform(progress, [0, 1], [40, 0]);
  const opacity = useTransform(progress, [0, 1], [0, 1]);

  const navigateTo = useCallback((section) => {
    if (isTransitioning.current) return;
    const idx = SECTION_ORDER.indexOf(section);
    if (idx === currentIndex.current) return;

    isTransitioning.current = true;
    progress.set(0);
    setRenderSection(section);
    setActiveSection(section);

    animate(progress, 1, {
      duration: 0.35,
      ease: "easeOut",
      onComplete: () => {
        currentIndex.current = idx;
        isTransitioning.current = false;
      },
    });
  }, [progress]);

  const handleClick = useCallback((section) => {
    navigateTo(section);
  }, [navigateTo]);

  useEffect(() => {
    animate(progress, 1, { duration: 0.5, ease: "easeOut" });
  }, [progress]);

  const handleCardMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 4;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`;
    card.style.transition = "transform 0.15s ease-out";
  };

  const handleCardMouseLeave = (e) => {
    e.currentTarget.style.transform = "";
    e.currentTarget.style.transition = "transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)";
  };

  const sections = {
    home: (
      <div className="bento-grid">
        <div className="bento-item bento-large" onMouseMove={handleCardMouseMove} onMouseLeave={handleCardMouseLeave}>
          <div className="home-hero">
            <img src="/portfolio_website_photo.png" alt="Jad Menkara" className="home-photo" />
            <div className="home-text">
              <h2 className="glow-text" style={{ fontSize: "36px", marginBottom: "12px" }}>Jad Menkara</h2>
              <p className="sub-glow" style={{ fontSize: "18px", marginBottom: "18px" }}>Heya! I'm Jad, a first year engineering (intended Electrical) student at The University of Toronto!</p>
              <p className="desc-text" style={{ fontSize: "16px", lineHeight: "1.8" }}>
                I have a passion for making cool stuff like robot arms, generators and more! I love going to hackathons (6x hackathon winner, 2x organizer), and playing guitar.
              </p>
            </div>
          </div>
        </div>
        <div className="bento-item" onMouseMove={handleCardMouseMove} onMouseLeave={handleCardMouseLeave}>
          <div className="bento-card-content">
            <h3>✦ Expertise</h3>
            <div className="skills-icons">
              {SKILLS.slice(0, 8).map((skill) => (
                <div key={skill.name} className="skill-icon" title={skill.name}>
                  <span className="skill-logo-text">{skill.logo}</span>
                  <span className="skill-name">{skill.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="bento-item" onMouseMove={handleCardMouseMove} onMouseLeave={handleCardMouseLeave}>
          <div className="bento-card-content">
            <h3>✦ Currently</h3>
            <p>Building exciting projects, learning new technologies, and looking for opportunities to collaborate!</p>
          </div>
        </div>
      </div>
    ),
    about_me: (
      <div className="bento-grid">
        <div className="bento-item bento-large" onMouseMove={handleCardMouseMove} onMouseLeave={handleCardMouseLeave}>
          <div className="bento-card-content">
            <h2 className="glow-text">About Me</h2>
            <p className="desc-text">
              A passionate developer with a keen eye for design. I bridge the gap between
              aesthetics and functionality to deliver impactful digital products.
            </p>
          </div>
        </div>
        <div className="bento-item" onMouseMove={handleCardMouseMove} onMouseLeave={handleCardMouseLeave}>
          <div className="bento-card-content">
            <h3>✦ Skills</h3>
            <div className="skills-grid">
              {SKILLS.map((skill) => (
                <div key={skill.name} className="skill-logo-item">
                  <span className="skill-logo-text">{skill.logo}</span>
                  <span className="skill-name-small">{skill.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="bento-item" onMouseMove={handleCardMouseMove} onMouseLeave={handleCardMouseLeave}>
          <div className="bento-card-content">
            <h3>✦ Interests</h3>
            <ul className="bullet-list">
              <li>Open Source</li>
              <li>AI/ML</li>
              <li>Cybersecurity</li>
              <li>Photography</li>
              <li>3D Modeling</li>
            </ul>
          </div>
        </div>
      </div>
    ),
    experiences: (
      <div className="bento-grid">
        <div className="bento-item bento-large" onMouseMove={handleCardMouseMove} onMouseLeave={handleCardMouseLeave}>
          <div className="bento-card-content">
            <h2 className="glow-text section-header">Experiences</h2>
          </div>
        </div>
        {EXPERIENCES.map((exp) => (
          <div
            key={exp.id}
            className="bento-item bento-tall"
            onMouseMove={handleCardMouseMove}
            onMouseLeave={handleCardMouseLeave}
            onClick={() => setExpandedExperience(exp)}
          >
            <div className="bento-card-content">
              <img src={exp.image} alt={exp.company} className="bento-image" />
              <h3 className="role-title">{exp.title}</h3>
              <p className="role-dates">{exp.company} · {exp.dates}</p>
              <div className="skill-tags">
                {exp.skills.map((skill) => (
                  <span key={skill} className="skill-tag">{skill}</span>
                ))}
              </div>
              <ul className="bullet-list">
                <li>{exp.description}</li>
                <li>{exp.details}</li>
              </ul>
            </div>
          </div>
        ))}
      </div>
    ),
    projects: (
      <div className="bento-grid">
        <div className="bento-item bento-large" onMouseMove={handleCardMouseMove} onMouseLeave={handleCardMouseLeave}>
          <div className="bento-card-content">
            <h2 className="glow-text section-header">Projects</h2>
          </div>
        </div>
        {PROJECTS.map((project) => (
          <div
            key={project.id}
            className="bento-item"
            onMouseMove={handleCardMouseMove}
            onMouseLeave={handleCardMouseLeave}
            onClick={() => setExpandedProject(project)}
          >
            <div className="bento-card-content">
              <img src={project.thumbnail} alt={project.title} className="bento-image" />
              <h3 className="role-title">{project.title}</h3>
              <div className="skill-tags">
                {project.skills.map((skill) => (
                  <span key={skill} className="skill-tag">{skill}</span>
                ))}
              </div>
              <ul className="bullet-list">
                <li>{project.description}</li>
              </ul>
            </div>
          </div>
        ))}
      </div>
    ),
    resume: (
      <div className="bento-grid">
        <div className="bento-item bento-large" onMouseMove={handleCardMouseMove} onMouseLeave={handleCardMouseLeave}>
          <div className="bento-card-content">
            <h2 className="glow-text">Resume</h2>
            <p className="desc-text">
              A detailed overview of my professional journey, education, and accomplishments.
            </p>
          </div>
        </div>
        <div className="bento-item bento-tall" onMouseMove={handleCardMouseMove} onMouseLeave={handleCardMouseLeave}>
          <div className="bento-card-content">
            <h3>✦ Education</h3>
            <ul className="bullet-list">
              <li>B.S. Computer Science</li>
              <li>University of Technology · 2015 – 2019</li>
              <li>M.S. Software Engineering</li>
              <li>Institute of Advanced Studies · 2020 – 2022</li>
            </ul>
          </div>
        </div>
        <div className="bento-item" onMouseMove={handleCardMouseMove} onMouseLeave={handleCardMouseLeave}>
          <div className="bento-card-content">
            <h3>✦ Certifications</h3>
            <ul className="bullet-list">
              <li>AWS Solutions Architect</li>
              <li>Google Cloud Professional</li>
              <li>Kubernetes Admin</li>
              <li>React Advanced</li>
              <li>Node.js Certified</li>
            </ul>
          </div>
        </div>
        <div className="bento-item bento-wide" onMouseMove={handleCardMouseMove} onMouseLeave={handleCardMouseLeave}>
          <div className="resume-content" style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }}>
            <iframe
              src="/MenkaraJad_Resume_Current.pdf"
              title="Resume PDF"
              className="pdf-iframe"
            />
          </div>
        </div>
      </div>
    ),
    contact: (
      <div className="bento-grid">
        <div className="bento-item bento-large" onMouseMove={handleCardMouseMove} onMouseLeave={handleCardMouseLeave}>
          <div className="bento-card-content">
            <h2 className="glow-text">Contact</h2>
            <p className="desc-text">
              Have a project in mind? Let's build something extraordinary together.
            </p>
          </div>
        </div>
        <div className="bento-item" onMouseMove={handleCardMouseMove} onMouseLeave={handleCardMouseLeave}>
          <div className="bento-card-content">
            <h3>✦ Get in Touch</h3>
            <ul className="bullet-list">
              <li className="contact-line">✉ jad.menkara@email.com</li>
              <li className="contact-line">☎ +1 (555) 123-4567</li>
              <li className="contact-line">☀ San Francisco, CA</li>
            </ul>
          </div>
        </div>
        <div className="bento-item" onMouseMove={handleCardMouseMove} onMouseLeave={handleCardMouseLeave}>
          <div className="bento-card-content">
            <h3>✦ Social</h3>
            <ul className="bullet-list">
              <li className="contact-line">GitHub · LinkedIn · Twitter</li>
              <li className="contact-line">Dribbble · Behance · Medium</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  };

  return (
    <div className="structure">
      <div className="sideBar">
        <button className={"sideButton" + (activeSection === "home" ? " active" : "")} id="home" onClick={() => handleClick("home")}>h<span className="tooltip">Home</span></button>
        <button className={"sideButton" + (activeSection === "about_me" ? " active" : "")} id="about_me" onClick={() => handleClick("about_me")}>aM<span className="tooltip">About Me</span></button>
        <button className={"sideButton" + (activeSection === "experiences" ? " active" : "")} id="experiences" onClick={() => handleClick("experiences")}>ex<span className="tooltip">Experiences</span></button>
        <button className={"sideButton" + (activeSection === "projects" ? " active" : "")} id="projects" onClick={() => handleClick("projects")}>pR<span className="tooltip">Projects</span></button>
        <button className={"sideButton" + (activeSection === "resume" ? " active" : "")} id="resume" onClick={() => handleClick("resume")}>rE<span className="tooltip">Resume</span></button>
        <button className={"sideButton" + (activeSection === "contact" ? " active" : "")} id="contact" onClick={() => handleClick("contact")}>cO<span className="tooltip">Contact</span></button>
      </div>

      <div className="mainBody">
        <motion.div
          key={renderSection}
          style={{ y, opacity }}
          className="section-wrapper"
        >
          {sections[renderSection]}
        </motion.div>
      </div>

      {expandedProject && (
        <motion.div
          className="project-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setExpandedProject(null)}
        >
          <motion.div
            className="project-fullscreen"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="project-close" onClick={() => setExpandedProject(null)}>✕</button>
            <h2 className="glow-text">{expandedProject.title}</h2>
            <p className="desc-text">{expandedProject.description}</p>
            <div className="skill-tags" style={{ justifyContent: 'center', marginBottom: '16px' }}>
              {expandedProject.skills.map((skill) => (
                <span key={skill} className="skill-tag">{skill}</span>
              ))}
            </div>
            <div className="project-images">
              {expandedProject.images.map((img, i) => (
                <div key={i} className="project-image-wrapper">
                  <img src={img.src} alt={`${expandedProject.title} ${i + 1}`} className="project-image" />
                  <p className="image-caption">{img.caption}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}

      {expandedExperience && (
        <motion.div
          className="project-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setExpandedExperience(null)}
        >
          <motion.div
            className="project-fullscreen"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="project-close" onClick={() => setExpandedExperience(null)}>✕</button>
            <h2 className="glow-text">{expandedExperience.title}</h2>
            <p className="desc-text">{expandedExperience.company} · {expandedExperience.dates}</p>
            <div className="skill-tags" style={{ justifyContent: 'center', marginBottom: '16px' }}>
              {expandedExperience.skills.map((skill) => (
                <span key={skill} className="skill-tag">{skill}</span>
              ))}
            </div>
            <p className="desc-text">{expandedExperience.description}</p>
            <p className="desc-text">{expandedExperience.details}</p>
            <div className="project-images">
              {expandedExperience.images.map((img, i) => (
                <div key={i} className="project-image-wrapper">
                  <img src={img.src} alt={`${expandedExperience.title} ${i + 1}`} className="project-image" />
                  <p className="image-caption">{img.caption}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default App;
