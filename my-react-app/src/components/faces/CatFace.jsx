import { useState } from 'react';
import { createPortal } from 'react-dom';
import './faces.css';
import './CatFace.css';

const photos = [
  "/cat_photos/cat_1.jpg",
  "/cat_photos/cat_2.jpg",
  "/cat_photos/cat_3.jpg",
  "/cat_photos/cat_4.jpg",
];

function CatPhotoModal({ src, onClose }) {
  return createPortal(
    <div className="cat-photo-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="cat-photo-modal" onClick={(e) => e.stopPropagation()}>
        <button className="cat-photo-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <img className="cat-photo-modal-image" src={src} alt="Full size cat" />
      </div>
    </div>,
    document.body
  );
}

export default function CatFace() {
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  return (
    <div className="face cat-face">
      <div className="face-inner">
        <h1 className="face-title">Cat Photos</h1>
        <div className="cat-grid">
          {photos.map((src, index) => (
            <button
              key={index}
              className="cat-photo-item"
              onClick={() => setSelectedPhoto(src)}
              aria-label={`Open cat photo ${index + 1}`}
            >
              <img src={src} alt={`Cat photo ${index + 1}`} />
            </button>
          ))}
        </div>
      </div>

      {selectedPhoto && (
        <CatPhotoModal src={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}
    </div>
  );
}
