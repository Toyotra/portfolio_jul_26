import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import './faces.css';
import './ProjectsFace.css';
import projects from '../../data/projects.json';

const ProjectCard = memo(function ProjectCard({ project, onClick }) {
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
          <div className="project-card-meta">
            {project.link ? (
              <a
                className="project-link-widget"
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                aria-label={`Open ${project.name} link`}
                title={project.link}
              >
                ↗
              </a>
            ) : null}
            <span className="project-date">{project.date}</span>
          </div>
        </div>
        <p className="project-desc">{project.description}</p>
      </div>
    </button>
  );
});

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
  const scrollRef = useRef(null);
  const thumbRef = useRef(null);
  const trackRef = useRef(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ y: 0, scrollTop: 0 });
  const thumbHeightRef = useRef(0);

  const updateThumb = useCallback(() => {
    const el = scrollRef.current;
    const thumb = thumbRef.current;
    const track = trackRef.current;
    if (!el || !thumb || !track) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    const overflow = scrollHeight > clientHeight;
    setHasOverflow(overflow);

    if (!overflow) {
      thumb.style.height = '0px';
      thumb.style.transform = 'translateY(0px)';
      thumbHeightRef.current = 0;
      return;
    }

    const trackH = clientHeight;
    const h = Math.max(30, (trackH / scrollHeight) * trackH);
    const y = (scrollTop / (scrollHeight - clientHeight)) * (trackH - h);

    thumb.style.height = `${h}px`;
    thumb.style.transform = `translateY(${y}px)`;
    thumbHeightRef.current = h;
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateThumb();
    el.addEventListener('scroll', updateThumb, { passive: true });
    window.addEventListener('resize', updateThumb);
    return () => {
      el.removeEventListener('scroll', updateThumb);
      window.removeEventListener('resize', updateThumb);
    };
  }, [updateThumb]);

  const onThumbMouseDown = (e) => {
    e.preventDefault();
    setDragging(true);
    drag.current = { y: e.clientY, scrollTop: scrollRef.current.scrollTop };
  };

  useEffect(() => {
    if (!dragging) return;

    const onMove = (e) => {
      const el = scrollRef.current;
      if (!el) return;
      const { clientHeight, scrollHeight } = el;
      const dy = e.clientY - drag.current.y;
      const trackH = clientHeight - thumbHeightRef.current;
      const range = scrollHeight - clientHeight;
      if (trackH > 0 && range > 0) {
        el.scrollTop = Math.max(0, Math.min(drag.current.scrollTop + (dy / trackH) * range, range));
      }
    };

    const onUp = () => setDragging(false);
    const onLeave = () => setDragging(false);

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('mouseleave', onLeave);

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, [dragging]);

  const onWheel = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="face projects-face">
      <div className="face-inner">
        <h1 className="face-title">Projects</h1>
        <p className="face-subtitle">Click a project to view details</p>
        <div className="projects-scroll-container">
          <div
            ref={scrollRef}
            className="projects-list"
            onWheel={onWheel}
            onMouseMove={(e) => window.dispatchEvent(new CustomEvent('custom-cursor-move', { detail: { x: e.clientX, y: e.clientY } }))}
            onMouseLeave={() => window.dispatchEvent(new CustomEvent('custom-cursor-move', { detail: { x: -100, y: -100 } }))}
          >
            {projects.map((project) => (
              <ProjectCard
                key={project.name}
                project={project}
                onClick={() => onSelectProject(project)}
              />
            ))}
          </div>
          {hasOverflow && (
            <div ref={trackRef} className="custom-scrollbar-track">
              <div
                ref={thumbRef}
                className="custom-scrollbar-thumb"
                onMouseDown={onThumbMouseDown}
              />
            </div>
          )}
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
