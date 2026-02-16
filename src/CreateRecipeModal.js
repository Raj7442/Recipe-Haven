import React, { useState } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || '';

const CreateRecipeModal = ({ open, onClose, token, onCreated }) => {
  const [title, setTitle] = useState('');
  const [image, setImage] = useState('');
  const [calories, setCalories] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!open) return null;

  const handleSave = async () => {
    setError(null);
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    const ingredients = ingredientsText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((text) => ({ text }));

    const payload = {
      title: title.trim(),
      image: image.trim() || null,
      calories: calories ? Number(calories) : null,
      ingredients,
    };

    try {
      setSaving(true);
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/api/recipes`, { method: 'POST', headers, body: JSON.stringify(payload) });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to save recipe');
      }

      const data = await res.json();
      onCreated && onCreated(data);
      // reset form
      setTitle('');
      setImage('');
      setCalories('');
      setIngredientsText('');
      onClose();
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={!saving ? onClose : undefined}>
      <div className="create-recipe-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>✨ Create New Recipe</h2>
          <button className="close-btn" onClick={onClose} disabled={saving}>
            ✕
          </button>
        </div>

        {error && (
          <div className="error-banner">
            ⚠️ {error}
          </div>
        )}

        <div className="form-container">
          <div className="form-group">
            <label>Recipe Title</label>
            <input 
              className="form-input"
              placeholder="Enter recipe name" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
            />
          </div>
          
          <div className="form-group">
            <label>Image URL (optional)</label>
            <input 
              className="form-input"
              placeholder="https://example.com/image.jpg" 
              value={image} 
              onChange={(e) => setImage(e.target.value)}
              disabled={saving}
            />
          </div>
          
          <div className="form-group">
            <label>Calories (optional)</label>
            <input 
              className="form-input"
              type="number"
              placeholder="e.g. 350" 
              value={calories} 
              onChange={(e) => setCalories(e.target.value)}
              disabled={saving}
            />
          </div>
          
          <div className="form-group">
            <label>Ingredients</label>
            <textarea 
              className="form-textarea"
              placeholder="Enter ingredients (one per line)\ne.g.\n2 cups flour\n1 tsp salt\n3 eggs"
              value={ingredientsText} 
              onChange={(e) => setIngredientsText(e.target.value)}
              rows={6}
              disabled={saving}
            />
          </div>
          
          <div className="modal-actions">
            <button className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <div className="spinner"></div>
                  Creating...
                </>
              ) : (
                <>🍳 Create Recipe</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRecipeModal;
