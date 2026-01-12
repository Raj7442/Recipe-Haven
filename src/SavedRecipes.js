import React, { useState } from "react";
import "./App.css";

const API_BASE =
  process.env.REACT_APP_API_URL || "http://localhost:3000";

const SavedRecipes = ({ open, onClose, favorites = [], token, refresh }) => {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editCalories, setEditCalories] = useState("");
  const [editIngredients, setEditIngredients] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditTitle(item.title || "");
    setEditCalories(item.calories?.toString() || "");
    setEditImage(item.image || "");
    setEditIngredients(
      (item.ingredients || []).map((i) => i.text).join("\n")
    );
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditCalories("");
    setEditImage("");
    setEditIngredients("");
  };

  const saveEdit = async (id) => {
    try {
      setSaving(true);

      const ingredients = editIngredients
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((text) => ({ text }));

      const res = await fetch(`${API_BASE}/api/recipes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: editTitle,
          calories: editCalories ? Number(editCalories) : null,
          image: editImage || null,
          ingredients,
        }),
      });

      if (!res.ok) throw new Error("Update failed");

      await refresh();
      cancelEdit();
    } catch (err) {
      alert("Failed to update recipe");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm("Delete this saved recipe?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/recipes/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) throw new Error("Delete failed");

      await refresh();
    } catch (err) {
      alert("Failed to delete recipe");
      console.error(err);
    }
  };

  return (
    <div className="modal-backdrop" onClick={!saving ? onClose : undefined}>
      <div className="my-recipes-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>❤️ Saved Recipes</h2>
          <button className="close-btn" onClick={onClose} disabled={saving}>✕</button>
        </div>

        <div className="recipes-container">
          {favorites.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💔</div>
              <h3>No saved recipes</h3>
              <p>Start saving recipes to see them here!</p>
            </div>
          ) : (
            <div className="recipes-grid">
              {favorites.map((item) => (
                <div key={item.id} className="recipe-card">
                  {item.image && (
                    <div className="recipe-image">
                      <img src={item.image} alt={item.title} loading="lazy" decoding="async" onLoad={(e) => e.currentTarget.classList.add('img-loaded')} />
                    </div>
                  )}
                  
                  <div className="recipe-content">
                    {editingId === item.id ? (
                      <div className="edit-form">
                        <div className="form-group">
                          <input
                            className="form-input"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="Recipe title"
                          />
                        </div>
                        <div className="form-group">
                          <input
                            className="form-input"
                            value={editImage}
                            onChange={(e) => setEditImage(e.target.value)}
                            placeholder="Image URL"
                          />
                        </div>
                        <div className="form-group">
                          <input
                            className="form-input"
                            type="number"
                            value={editCalories}
                            onChange={(e) => setEditCalories(e.target.value)}
                            placeholder="Calories"
                          />
                        </div>
                        <div className="form-group">
                          <textarea
                            className="form-textarea"
                            rows={4}
                            value={editIngredients}
                            onChange={(e) => setEditIngredients(e.target.value)}
                            placeholder="One ingredient per line"
                          />
                        </div>
                        <div className="recipe-actions">
                          <button
                            className="action-btn view-btn"
                            onClick={() => saveEdit(item.id)}
                            disabled={saving}
                          >
                            💾 Save
                          </button>
                          <button className="action-btn delete-btn" onClick={cancelEdit}>
                            ❌ Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="recipe-title">{item.title}</h3>
                        <div className="recipe-meta">
                          {item.calories && <span>🔥 {Math.round(item.calories)} cal</span>}
                          <span>🥄 {(item.ingredients || []).length} ingredients</span>
                        </div>
                        <div className="recipe-actions">
                          <button 
                            className="action-btn edit-btn" 
                            onClick={() => startEdit(item)}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => onDelete(item.id)}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedRecipes;
