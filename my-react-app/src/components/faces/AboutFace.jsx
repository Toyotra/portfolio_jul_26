import './faces.css';
import './AboutFace.css';
import skillsByCategory from './skills.json';

export default function AboutFace() {
  return (
    <div className="face about-face">
      <div className="face-inner">
        <h1 className="face-title">About Me</h1>
        <div className="skills-container">
          {Object.entries(skillsByCategory).map(([category, skills]) => (
            <div className="skill-category" key={category}>
              <h3 className="category-title">{category}</h3>
              <div className="skills-grid">
                {skills.map((skill) => (
                  <div className="skill-item" key={skill.name}>
                    <img src={skill.src} alt={skill.name} className="skill-svg" />
                    <span className="skill-tooltip">{skill.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
