import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import awards from '../../data/awards.json';
import './faces.css';
import './HomeFace.css';

const ROLES = [
  'hardware engineer',
  'engineering student',
  'guitarist',
  'speed typer',
  'hackathon winner',
];

const TYPE_SPEED = 100;
const DELETE_SPEED = 50;
const PAUSE_AFTER_TYPE = 2000;

function AwardsModal({ onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="awards-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="awards-modal" onClick={(e) => e.stopPropagation()}>
        <button className="awards-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2 className="awards-modal-title">Awards</h2>
        <ul className="awards-list">
          {awards.map((award, i) => (
            <li key={i}>
              <span className="award-title">{award.title}</span>
              <span className="award-date">{award.date}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function HomeFace() {
  const [text, setText] = useState('');
  const [roleIndex, setRoleIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAwards, setShowAwards] = useState(false);

  useEffect(() => {
    const currentRole = ROLES[roleIndex];

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (text.length < currentRole.length) {
          setText(currentRole.slice(0, text.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), PAUSE_AFTER_TYPE);
        }
      } else {
        if (text.length > 0) {
          setText(text.slice(0, -1));
        } else {
          setIsDeleting(false);
          setRoleIndex((roleIndex + 1) % ROLES.length);
        }
      }
    }, isDeleting ? DELETE_SPEED : TYPE_SPEED);

    return () => clearTimeout(timer);
  }, [text, isDeleting, roleIndex]);

  return (
    <div className="face home-face">
      <h1 className="face-title">
        Jad Menkara:<br></br>{' '}
        <span className="typewriter-text">
          {text}
          <span className="cursor">|</span>
        </span>
      </h1>

      <br />
      <p className="face-subtitle" id="face-subtitle-A">
        
        - National Science Fair (CWSF) winner<br></br>
        {/*- IEEE First Author @ 17 (pending)<br></br>*/}
        - Paid Surgical Robotics Research since 15<br></br>
        - Recruited by T20 rocket team in high school<br></br>
        - 6x Hackathon Winner<br></br>
        - University of Toronto EE (int.)
         </p>
         <br></br>


      <div className="homeImages">
        <img src="/b.jpg" alt="Home" loading="lazy" />
        <button className="awards-button" onClick={() => setShowAwards(true)}>
          Awards
        </button>
      </div>

      {showAwards &&
        createPortal(
          <AwardsModal onClose={() => setShowAwards(false)} />,
          document.body
        )}
    </div>
  );
}
