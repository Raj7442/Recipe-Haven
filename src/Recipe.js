import React, { useState, useEffect, useCallback } from 'react';
import style from './recipe.module.css';

const Recipe = ({ title, calories, image, ingredients, saved: propsSaved, onSave, onRemove }) => {
  const [showModal, setShowModal] = useState(false);
  const [saved, setSaved] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    // Use saved prop if provided (preferred), otherwise fallback to localStorage check
    try {
      if (typeof propsSaved !== 'undefined') {
        setSaved(propsSaved);
        return;
      }
      const favs = JSON.parse(window.localStorage.getItem('favorites') || '[]');
      setSaved(favs.some((f) => f.title === title));
    } catch (e) {
      // ignore
    }
  }, [title, propsSaved]);

  const toggleSave = useCallback(async () => {
    if (saved) {
      if (onRemove) {
        try {
          await onRemove(title);
        } catch (err) {
          console.error('Failed to remove recipe:', err);
          alert(err.message || 'Failed to remove recipe');
        }
        setSaved(false);
        return;
      }

      // fallback to localStorage
      try {
        const favs = JSON.parse(window.localStorage.getItem('favorites') || '[]');
        const next = favs.filter((f) => f.title !== title);
        window.localStorage.setItem('favorites', JSON.stringify(next));
        setSaved(false);
      } catch (e) {
        console.error('localStorage remove failed', e);
      }
    } else {
      if (onSave) {
        try {
          await onSave({ title, image, calories, ingredients });
          setSaved(true);
        } catch (err) {
          console.error('Failed to save recipe:', err);
          alert(err.message || 'Failed to save recipe');
        }
        return;
      }

      try {
        const favs = JSON.parse(window.localStorage.getItem('favorites') || '[]');
        favs.push({ title, image, calories, ingredients });
        window.localStorage.setItem('favorites', JSON.stringify(favs));
        setSaved(true);
      } catch (e) {
        console.error('localStorage save failed', e);
        alert('Failed to save locally');
      }
    }
  }, [saved, onSave, onRemove, title, image, calories, ingredients]);

  const copyLink = useCallback(async () => {
    const text = `${title}`;
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied recipe title to clipboard');
    } catch (e) {
      alert('Copy failed');
    }
  }, [title]);

  return (
    <div className={style.card}>
      <div className={style['cal-badge']}>{Math.round(calories)} cal</div>
      <img
        src={image}
        alt={title}
        loading="lazy"
        decoding="async"
        className={imgLoaded ? style['img-loaded'] : ''}
        onLoad={() => setImgLoaded(true)}
      />

      <div className={style.overlay}>
        <button className={style.btn} onClick={() => setShowModal(true)} aria-label={`View ${title}`}>View</button>
        <button className={style.btn} onClick={toggleSave} aria-pressed={saved} aria-label={`${saved ? 'Unsave' : 'Save'} ${title}`}>{saved ? 'Saved' : 'Save'}</button>
        <button className={style.btn} onClick={copyLink} aria-label={`Copy ${title}`}>Copy</button>
      </div>

      <div className={style['card-body']}>
        <div className={style['card-title']}>{title}</div>
        <div className={style['card-sub']}>{ingredients.length} ingredients</div>
      </div>

      {showModal && (
        <div className={style['modal-backdrop']} onClick={() => setShowModal(false)}>
          <div className={style.modal} onClick={(e) => e.stopPropagation()}>
            <button className={style['modal-close']} onClick={() => setShowModal(false)}>Close</button>
            <h3>{title}</h3>
            <p><strong>Calories:</strong> {Math.round(calories)}</p>
            <ul className={style['ingredients-list']}>
              {ingredients.map((ing, idx) => (
                <li key={idx}>{ing.text}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

// Prevent unnecessary re-renders: only update when minimal props change
export default React.memo(Recipe, (prev, next) => {
  return (
    prev.saved === next.saved &&
    prev.title === next.title &&
    prev.image === next.image &&
    prev.calories === next.calories &&
    (prev.ingredients?.length || 0) === (next.ingredients?.length || 0)
  );
});

