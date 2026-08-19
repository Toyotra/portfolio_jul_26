import { useState, useEffect } from 'react';
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
const PAUSE_AFTER_DELETE = 500;

export default function HomeFace() {
  const [text, setText] = useState('');
  const [roleIndex, setRoleIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

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
          setTimeout(() => {}, PAUSE_AFTER_DELETE);
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
        Hi! I'm Jad, an electrical (int.) engineering student at the University
        of Toronto. I build robots! I am most skilled in PCB Design, CAD, simulation software (FEA, CFD, Gazebo etc.).
        I'm also an avid guitarist, hackathon entheusiast (winner, organizer, mentor), and lifter.
      </p>

      <br />

      <div className="homeImages">
        <img src="/b.jpg" />
      </div>
    </div>
  );
}
