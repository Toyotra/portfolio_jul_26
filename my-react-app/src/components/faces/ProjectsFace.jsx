import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './faces.css';
import './ProjectsFace.css';
import projects from '../../data/projects.json';

function ProjectCard({ project, onClick }) {
  return (
    <button className="project-card" onClick={onClick} aria-label={`Open ${project.name}`}>
      <img
        className="project-thumb"
        src={project.thumbnail}
        alt={`${project.name} thumbnail`}
        loading="lazy"
      />
      <div className="project-card-body">
        <div className="project-card-head">
          <span className="project-name">{project.name}</span>
          <span className="project-date">{project.date}</span>
        </div>
        <p className="project-desc">{project.description}</p>
      </div>
    </button>
  );
}

function ProjectModal({ project, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="project-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="project-modal" onClick={(e) => e.stopPropagation()}>
        <button className="project-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className="project-modal-header">
          <img className="project-modal-thumb" src={project.thumbnail} alt={`${project.name} thumbnail`} />
          <div>
            <h2 className="project-modal-title">{project.name}</h2>
            <span className="project-modal-date">{project.date}</span>
          </div>
        </div>
        <p className="project-modal-desc">{project.description}</p>
        <ul className="project-bullets">
          {project.bulletPoints.map((point, i) => (
            <li key={i}>{point}</li>
          ))}
        </ul>
        {project.images && project.images.length > 0 && (
          <div className="project-images">
            {project.images.map((src, i) => (
              <img key={i} className="project-image" src={src} alt={`${project.name} shot ${i + 1}`} loading="lazy" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProjectsFace({ selectedProject, onSelectProject }) {
  return (
    <div className="face projects-face">
      <div className="face-inner">
        <h1 className="face-title">Projects</h1>
        <p className="face-subtitle">Click a project to view details</p>
        <div className="projects-list">
          {projects.map((project) => (
            <ProjectCard
              key={project.name}
              project={project}
              onClick={() => onSelectProject(project)}
            />
          ))}
        </div>

        {selectedProject &&
          createPortal(
            <ProjectModal
              project={selectedProject}
              onClose={() => onSelectProject(null)}
            />,
            document.body
          )}
      </div>
    </div>
  );
}
