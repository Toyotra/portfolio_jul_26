import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import './faces.css';
import './ExperiencesFace.css';
import experiences from '../../data/experiences.json';

const ExperienceCard = memo(function ExperienceCard({ experience, onClick }) {
  return (
    <button className="experience-card" onClick={onClick} aria-label={`Open ${experience.name}`}>
      <img
        className="experience-thumb"
        src={experience.thumbnail}
        alt={`${experience.name} thumbnail`}
        loading="lazy"
      />
      <div className="experience-card-body">
        <div className="experience-card-head">
          <span className="experience-name">{experience.name}</span>
        </div>
        <span className="experience-company">{experience.company}</span>
        <span className="experience-date">{experience.date}</span>
        <p className="experience-desc">{experience.description}</p>
      </div>
    </button>
  );
});

function ExperienceModal({ experience, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="experience-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="experience-modal" onClick={(e) => e.stopPropagation()}>
        <button className="experience-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className="experience-modal-header">
          <img className="experience-modal-thumb" src={experience.thumbnail} alt={`${experience.name} thumbnail`} />
          <div>
            <h2 className="experience-modal-title">{experience.name}</h2>
            <span className="experience-modal-company">{experience.company}</span>
            <span className="experience-modal-date">{experience.date}</span>
          </div>
        </div>
        <p className="experience-modal-desc">{experience.description}</p>
        <ul className="experience-bullets">
          {experience.bulletPoints.map((point, i) => (
            <li key={i}>{point}</li>
          ))}
        </ul>
        {experience.images && experience.images.length > 0 && (
          <div className="experience-images">
            {experience.images.map((src, i) => (
              <img key={i} className="experience-image" src={src} alt={`${experience.name} shot ${i + 1}`} loading="lazy" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExperiencesFace() {
  const scrollLeftRef = useRef(null);
  const scrollRightRef = useRef(null);
  const thumbLeftRef = useRef(null);
  const thumbRightRef = useRef(null);
  const trackLeftRef = useRef(null);
  const trackRightRef = useRef(null);
  const [hasLeftOverflow, setHasLeftOverflow] = useState(false);
  const [hasRightOverflow, setHasRightOverflow] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState(null);
  const drag = useRef({ y: 0, scrollTop: 0 });

  const updateThumb = useCallback((scrollEl, thumbEl, trackEl, setHasOverflow) => {
    if (!scrollEl || !thumbEl || !trackEl) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollEl;
    const overflow = scrollHeight > clientHeight;
    setHasOverflow(overflow);

    if (!overflow) {
      thumbEl.style.height = '0px';
      thumbEl.style.transform = 'translateY(0px)';
      return;
    }

    const trackH = clientHeight;
    const h = Math.max(30, (trackH / scrollHeight) * trackH);
    const y = (scrollTop / (scrollHeight - clientHeight)) * (trackH - h);

    thumbEl.style.height = `${h}px`;
    thumbEl.style.transform = `translateY(${y}px)`;
  }, []);

  const updateLeftThumb = useCallback(() => {
    updateThumb(scrollLeftRef.current, thumbLeftRef.current, trackLeftRef.current, setHasLeftOverflow);
  }, [updateThumb]);

  const updateRightThumb = useCallback(() => {
    updateThumb(scrollRightRef.current, thumbRightRef.current, trackRightRef.current, setHasRightOverflow);
  }, [updateThumb]);

  useEffect(() => {
    const leftEl = scrollLeftRef.current;
    const rightEl = scrollRightRef.current;
    if (!leftEl || !rightEl) return;
    updateLeftThumb();
    updateRightThumb();
    leftEl.addEventListener('scroll', updateLeftThumb, { passive: true });
    rightEl.addEventListener('scroll', updateRightThumb, { passive: true });
    window.addEventListener('resize', () => {
      updateLeftThumb();
      updateRightThumb();
    });
    return () => {
      leftEl.removeEventListener('scroll', updateLeftThumb);
      rightEl.removeEventListener('scroll', updateRightThumb);
      window.removeEventListener('resize', updateLeftThumb);
      window.removeEventListener('resize', updateRightThumb);
    };
  }, [updateLeftThumb, updateRightThumb]);

  const onThumbMouseDown = (e, scrollEl) => {
    e.preventDefault();
    setDragging(true);
    setDragTarget(scrollEl);
    drag.current = { y: e.clientY, scrollTop: scrollEl.scrollTop };
  };

  useEffect(() => {
    if (!dragging) return;

    const onMove = (e) => {
      const el = dragTarget;
      if (!el) return;
      const { clientHeight, scrollHeight } = el;
      const dy = e.clientY - drag.current.y;
      const trackH = clientHeight;
      const range = scrollHeight - clientHeight;
      if (range > 0) {
        el.scrollTop = Math.max(0, Math.min(drag.current.scrollTop + (dy / trackH) * range, range));
      }
    };

    const onUp = () => {
      setDragging(false);
      setDragTarget(null);
    };
    const onLeave = () => {
      setDragging(false);
      setDragTarget(null);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('mouseleave', onLeave);

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, [dragging, dragTarget]);

  const onWheel = (e) => {
    e.stopPropagation();
  };

  const [selectedWork, setSelectedWork] = useState(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);

  return (
    <div className="face experiences-face">
      <div className="face-inner">
        <h1 className="face-title">Experiences</h1>
        <div className="experiences-columns">
          <div className="experiences-column">
            <h2 className="experience-column-title">Work Experience</h2>
            <div className="experience-scroll-container">
              <div
                ref={scrollLeftRef}
                className="experience-list"
                onWheel={onWheel}
                onMouseMove={(e) => window.dispatchEvent(new CustomEvent('custom-cursor-move', { detail: { x: e.clientX, y: e.clientY } }))}
                onMouseLeave={() => window.dispatchEvent(new CustomEvent('custom-cursor-move', { detail: { x: -100, y: -100 } }))}
              >
                {experiences.work.map((experience) => (
                  <ExperienceCard
                    key={experience.name}
                    experience={experience}
                    onClick={() => setSelectedWork(experience)}
                  />
                ))}
              </div>
              {hasLeftOverflow && (
                <div ref={trackLeftRef} className="custom-scrollbar-track">
                  <div
                    ref={thumbLeftRef}
                    className="custom-scrollbar-thumb"
                    onMouseDown={(e) => onThumbMouseDown(e, scrollLeftRef.current)}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="experiences-column">
            <h2 className="experience-column-title">Volunteer Experience</h2>
            <div className="experience-scroll-container">
              <div
                ref={scrollRightRef}
                className="experience-list"
                onWheel={onWheel}
                onMouseMove={(e) => window.dispatchEvent(new CustomEvent('custom-cursor-move', { detail: { x: e.clientX, y: e.clientY } }))}
                onMouseLeave={() => window.dispatchEvent(new CustomEvent('custom-cursor-move', { detail: { x: -100, y: -100 } }))}
              >
                {experiences.volunteer.map((experience) => (
                  <ExperienceCard
                    key={experience.name}
                    experience={experience}
                    onClick={() => setSelectedVolunteer(experience)}
                  />
                ))}
              </div>
              {hasRightOverflow && (
                <div ref={trackRightRef} className="custom-scrollbar-track">
                  <div
                    ref={thumbRightRef}
                    className="custom-scrollbar-thumb"
                    onMouseDown={(e) => onThumbMouseDown(e, scrollRightRef.current)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedWork &&
          createPortal(
            <ExperienceModal
              experience={selectedWork}
              onClose={() => setSelectedWork(null)}
            />,
            document.body
          )}

        {selectedVolunteer &&
          createPortal(
            <ExperienceModal
              experience={selectedVolunteer}
              onClose={() => setSelectedVolunteer(null)}
            />,
            document.body
          )}
      </div>
    </div>
  );
}
