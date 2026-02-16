import React, { useState, useEffect, useCallback } from "react";
import "./App.css";

const API_URL = process.env.REACT_APP_API_URL || '';

const MyRecipes = ({ open, onClose, token, refresh }) => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    image: '',
    calories: '',
    ingredients: ''
  });
  const [viewingRecipe, setViewingRecipe] = useState(null);

  const fetchMyRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/recipes`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setRecipes(data);
      }
    } catch (err) {
      console.error('Failed to fetch recipes:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (open) {
      fetchMyRecipes();
    }
  }, [open, fetchMyRecipes]);

  const startEdit = (recipe) => {
    setEditingId(recipe.id);
    setEditForm({
      title: recipe.title || '',
      image: recipe.image || '',
      calories: recipe.calories?.toString() || '',
      ingredients: (recipe.ingredients || []).map(i => i.text).join('\n')
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ title: '', image: '', calories: '', ingredients: '' });
  };

  const saveEdit = async (id) => {
    try {
      const ingredients = editForm.ingredients
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)
        .map(text => ({ text }));

      const res = await fetch(`${API_URL}/api/recipes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          title: editForm.title,
          image: editForm.image || null,
          calories: editForm.calories ? Number(editForm.calories) : null,
          ingredients
        })
      });

      if (res.ok) {
        await fetchMyRecipes();
        cancelEdit();
        refresh && refresh();
      }
    } catch (err) {
      console.error('Failed to update recipe:', err);
    }
  };

  const deleteRecipe = async (id) => {
    if (!window.confirm('Delete this recipe?')) return;
    
    try {
      const res = await fetch(`${API_URL}/api/recipes/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.ok) {
        await fetchMyRecipes();
        refresh && refresh();
      }
    } catch (err) {
      console.error('Failed to delete recipe:', err);
    }
  };

  const viewRecipe = (recipe) => {
    setViewingRecipe(recipe);
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="my-recipes-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📝 My Recipes</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="recipes-container">
          {loading ? (
            <div className="loading-state">
              <div className="spinner-large"></div>
              <p>Loading your recipes...</p>
            </div>
          ) : recipes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🍽️</div>
              <h3>No recipes yet</h3>
              <p>Create your first recipe to get started!</p>
            </div>
          ) : (
            <div className="recipes-grid">
              {recipes.map((recipe) => (
                <div key={recipe.id} className="recipe-card">
                  {recipe.image && (
                    <div className="recipe-image">
                      <img src={recipe.image} alt={recipe.title} loading="lazy" decoding="async" onLoad={(e) => e.currentTarget.classList.add('img-loaded')} />
                    </div>
                  )}
                  
                  <div className="recipe-content">
                    <h3 className="recipe-title">{recipe.title}</h3>
                    <div className="recipe-meta">
                      {recipe.calories && <span>🔥 {Math.round(recipe.calories)} cal</span>}
                      <span>🥄 {(recipe.ingredients || []).length} ingredients</span>
                    </div>
                    
                    <div className="recipe-actions">
                      <button 
                        className="action-btn view-btn"
                        onClick={() => viewRecipe(recipe)}
                      >
                        👁️ View
                      </button>
                      <button 
                        className="action-btn edit-btn"
                        onClick={() => startEdit(recipe)}
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        className="action-btn delete-btn"
                        onClick={() => deleteRecipe(recipe.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {editingId && (
          <div className="edit-overlay">
            <div className="edit-modal">
              <div className="edit-header">
                <h3>✏️ Edit Recipe</h3>
                <button className="close-btn" onClick={cancelEdit}>✕</button>
              </div>
              
              <div className="edit-form">
                <div className="form-group">
                  <label>Title</label>
                  <input
                    className="form-input"
                    value={editForm.title}
                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Image URL</label>
                  <input
                    className="form-input"
                    value={editForm.image}
                    onChange={(e) => setEditForm({...editForm, image: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Calories</label>
                  <input
                    className="form-input"
                    type="number"
                    value={editForm.calories}
                    onChange={(e) => setEditForm({...editForm, calories: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Ingredients</label>
                  <textarea
                    className="form-textarea"
                    rows={6}
                    value={editForm.ingredients}
                    onChange={(e) => setEditForm({...editForm, ingredients: e.target.value})}
                  />
                </div>
                
                <div className="edit-actions">
                  <button className="btn-secondary" onClick={cancelEdit}>Cancel</button>
                  <button className="btn-primary" onClick={() => saveEdit(editingId)}>
                    💾 Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Modal */}
        {viewingRecipe && (
          <div className="view-overlay">
            <div className="view-modal">
              <div className="view-header">
                <h3>👁️ {viewingRecipe.title}</h3>
                <button className="close-btn" onClick={() => setViewingRecipe(null)}>✕</button>
              </div>
              
              <div className="view-content">
                {viewingRecipe.image && (
                  <img className="view-image" src={viewingRecipe.image} alt={viewingRecipe.title} loading="lazy" decoding="async" onLoad={(e) => e.currentTarget.classList.add('img-loaded')} />
                )}
                
                <div className="view-meta">
                  {viewingRecipe.calories && (
                    <div className="meta-item">
                      <span className="meta-label">🔥 Calories:</span>
                      <span>{Math.round(viewingRecipe.calories)}</span>
                    </div>
                  )}
                </div>
                
                <div className="ingredients-section">
                  <h4>🥄 Ingredients</h4>
                  <ul className="ingredients-list">
                    {(viewingRecipe.ingredients || []).map((ingredient, idx) => (
                      <li key={idx}>{ingredient.text}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRecipes;