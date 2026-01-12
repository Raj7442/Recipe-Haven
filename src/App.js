import React, { useEffect, useState, useCallback } from 'react';
import './App.css';
import Recipe from './Recipe';
import SavedRecipes from './SavedRecipes';
import CreateRecipeModal from './CreateRecipeModal';
import MyRecipes from './MyRecipes';
import WelcomePage from './WelcomePage';

const App = () => {
  // Use environment variables for credentials (read at build time)
  const APP_ID = process.env.REACT_APP_EDAMAM_ID;
  const APP_KEY = process.env.REACT_APP_EDAMAM_KEY;

  // Debug logging for API credentials
  useEffect(() => {
    console.log('API Credentials Check:');
    console.log('APP_ID exists:', !!APP_ID);
    console.log('APP_KEY exists:', !!APP_KEY);
    if (APP_ID) console.log('APP_ID length:', APP_ID.length);
    if (APP_KEY) console.log('APP_KEY length:', APP_KEY.length);
  }, [APP_ID, APP_KEY]);

  const [recipes, setRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [showSaved, setShowSaved] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showMyRecipes, setShowMyRecipes] = useState(false);

  // First-time greeting state for new users (per-account)
  const [showFirstTimeGreeting, setShowFirstTimeGreeting] = useState(false);

  // Search suggestions dropdown
  const [showSuggestions, setShowSuggestions] = useState(false);
  const SEARCH_SUGGESTIONS = ['pasta', 'chicken', 'salad', 'dessert', 'soup'];

  const [ownerId, setOwnerId] = useState(() => {
    try {
      const existing = window.localStorage.getItem('ownerId');
      if (existing) return existing;
      const gen = `anon_${Math.random().toString(36).slice(2, 10)}`;
      window.localStorage.setItem('ownerId', gen);
      return gen;
    } catch (e) {
      // In very restricted environments localStorage may be unavailable
      return `anon_${Math.random().toString(36).slice(2, 10)}`;
    }
  });
  const [favorites, setFavorites] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [favoritesError, setFavoritesError] = useState(null);
  const [token, setToken] = useState(window.localStorage.getItem('token') || null);
  const [authUser, setAuthUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [showWelcome, setShowWelcome] = useState(!token);

  // Validate token on app startup
  useEffect(() => {
    const validateToken = async () => {
      if (token) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const user = await res.json();
            setAuthUser(user);
            setShowWelcome(false);
            // Load user's recipes
            fetchFavorites(token);
          } else {
            // Token is invalid, clear it
            setToken(null);
            window.localStorage.removeItem('token');
            setShowWelcome(true);
          }
        } catch (e) {
          console.error('Token validation failed:', e);
          setToken(null);
          window.localStorage.removeItem('token');
          setShowWelcome(true);
        }
      }
    };
    
    validateToken();
  }, []); // Run only once on app startup

  useEffect(() => {
    // Ensure ownerId (per-browser user identifier)
    let owner = window.localStorage.getItem('ownerId');
    if (!owner) {
      owner = `anon_${Math.random().toString(36).slice(2, 10)}`;
      window.localStorage.setItem('ownerId', owner);
    }
    setOwnerId(owner);
  }, []);

  // Show first-time greeting only for newly seen auth users
  useEffect(() => {
    if (!authUser) return;
    try {
      const key = `seenWelcome_${authUser.id}`;
      const seen = window.localStorage.getItem(key);
      setShowFirstTimeGreeting(!seen);
    } catch (e) {
      setShowFirstTimeGreeting(false);
    }
  }, [authUser]);

  const dismissFirstTimeGreeting = () => {
    if (authUser) {
      try { window.localStorage.setItem(`seenWelcome_${authUser.id}`, '1'); } catch (e) {}
    }
    setShowFirstTimeGreeting(false);
  };

  // Modal open helpers: ensure only one modal is visible at a time
  const openCreateModal = () => { setShowCreate(true); setShowMyRecipes(false); setShowSaved(false); };
  const openMyRecipesModal = () => { setShowMyRecipes(true); setShowCreate(false); setShowSaved(false); };
  const openSavedModal = () => { setShowSaved(true); setShowCreate(false); setShowMyRecipes(false); };

  // Explicit home helper
  const goHome = () => {
    setSearchTerm('');
    setRecipes([]);
    setHasSearched(false);
    setIsLoading(false);
    setError(null);
    setShowCreate(false);
    setShowMyRecipes(false);
    setShowSaved(false);
    setShowSuggestions(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // When any of the top-level modals are open, blur the background and lock body scroll
  useEffect(() => {
    const appEl = document.querySelector('.App');
    const anyOpen = showSaved || showCreate || showMyRecipes;
    if (appEl) {
      if (anyOpen) {
        appEl.classList.add('blurred');
        document.body.style.overflow = 'hidden';
      } else {
        appEl.classList.remove('blurred');
        document.body.style.overflow = '';
      }
    }
    return () => {
      if (appEl) {
        appEl.classList.remove('blurred');
        document.body.style.overflow = '';
      }
    };
  }, [showSaved, showCreate, showMyRecipes]);

  // Debounced live search: as user types, perform search after pause
  useEffect(() => {
    const term = (searchTerm || '').trim();

    if (!term) {
      // If input cleared, hide suggestions and clear results
      setShowSuggestions(false);
      setRecipes([]);
      setHasSearched(false);
      return;
    }

    setShowSuggestions(true);

    const id = setTimeout(() => {
      setHasSearched(true);
      getRecipes(term);
    }, 450);

    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);
  // Define fetchFavorites function (stable and resilient)
  const fetchFavorites = useCallback(async (tokenArg = token, { retries = 1, timeout = 10000 } = {}) => {
    setFavoritesLoading(true);
    setFavoritesError(null);

    // If user is logged in, show cached favorites immediately (fast UI on refresh)
    try {
      const cached = JSON.parse(window.localStorage.getItem('favorites') || '[]');
      if (cached && cached.length) {
        setFavorites(cached);
        setFavoritesCount(cached.length);
      }
    } catch (e) {
      // ignore parse errors
    }

    try {
      const currentToken = tokenArg || token;
      // if token present, verify and fetch server-side favorites
      if (currentToken) {
        let attempt = 0;
        while (attempt <= retries) {
          attempt += 1;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);

          try {
            const meRes = await fetch('/api/auth/me', {
              headers: { Authorization: `Bearer ${currentToken}` },
              signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (meRes.ok) {
              const me = await meRes.json();
              setAuthUser(me);
            } else {
              // token invalid - clear and stop
              setToken(null);
              window.localStorage.removeItem('token');
              throw new Error('Authentication failed');
            }

            const listRes = await fetch('/api/recipes', {
              headers: { Authorization: `Bearer ${currentToken}` },
              signal: controller.signal
            });

            if (listRes.ok) {
              const items = await listRes.json();
              setFavorites(items);
              setFavoritesCount(items.length);
              // persist a local cache for fast refreshes
              try {
                window.localStorage.setItem('favorites', JSON.stringify(items));
              } catch (e) {}

              setFavoritesLoading(false);
              return;
            } else if (listRes.status >= 500 && attempt <= retries) {
              // try again on server errors
              await new Promise(r => setTimeout(r, 1000 * attempt));
              continue;
            } else {
              // Non-recoverable server response
              const body = await listRes.json().catch(() => ({}));
              throw new Error(body.error || `Failed to load favorites (${listRes.status})`);
            }
          } catch (fetchError) {
            clearTimeout(timeoutId);
            if (fetchError.name === 'AbortError') {
              // request timed out; try again if attempts remain
              if (attempt <= retries) {
                await new Promise(r => setTimeout(r, 1000 * attempt));
                continue;
              }
            }
            if (attempt <= retries) {
              await new Promise(r => setTimeout(r, 1000 * attempt));
              continue;
            }
            // rethrow after retries exhausted
            throw fetchError;
          }
        }
      }

      // If no token (or token failed), fallback to localStorage
      try {
        const favs = JSON.parse(window.localStorage.getItem('favorites') || '[]');
        setFavoritesCount(favs.length);
        setFavorites(favs);
      } catch (e) {
        setFavoritesCount(0);
        setFavorites([]);
      }
    } catch (e) {
      console.error('Failed to fetch favorites:', e);
      setFavoritesError(e.message || 'Failed to load favorites');
    } finally {
      setFavoritesLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token && !showWelcome) {
      fetchFavorites();
    }

    const onStorage = () => {
      const updated = JSON.parse(window.localStorage.getItem('favorites') || '[]');
      setFavoritesCount(updated.length);
      setFavorites(updated);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [token, showWelcome, fetchFavorites]);

  const saveRecipe = useCallback(async (recipe) => {
    const payload = { ...recipe };
    try {
      let headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      else payload.ownerId = ownerId;

      const res = await fetch('/api/recipes', { method: 'POST', headers, body: JSON.stringify(payload) });
      if (!res.ok) {
        // Treat non-OK responses as errors so we fall back to localStorage
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Save failed (${res.status})`);
      }

      const item = await res.json();
      // update local cache immediately
      try {
        const cached = JSON.parse(window.localStorage.getItem('favorites') || '[]');
        const exists = cached.some((f) => f.title === item.title || String(f.id) === String(item.id));
        const next = exists ? cached.map((f) => (f.title === item.title ? item : f)) : [...cached, item];
        window.localStorage.setItem('favorites', JSON.stringify(next));
        setFavorites(next);
        setFavoritesCount(next.length);
      } catch (err) {
        // ignore cache write errors
      }

      // try to refresh from server to get canonical list (best-effort)
      try { await fetchFavorites(); } catch (e) {}
      return item;
    } catch (e) {
      // fallback to localStorage
      const favs = JSON.parse(window.localStorage.getItem('favorites') || '[]');
      favs.push(payload);
      window.localStorage.setItem('favorites', JSON.stringify(favs));
      setFavorites(favs);
      setFavoritesCount(favs.length);
      setFavoritesError(e.message || 'Save failed');
    }
  }, [token, ownerId, fetchFavorites]);

  const removeRecipe = useCallback(async (id, title) => {
    try {
      let headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`/api/recipes/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        setFavorites((s) => {
          const next = s.filter((r) => String(r.id) !== String(id));
          try { window.localStorage.setItem('favorites', JSON.stringify(next)); } catch (e) {}
          setFavoritesCount(next.length);
          return next;
        });

        // Attempt to refresh server cache (best-effort)
        try { await fetchFavorites(); } catch (err) {}
        return true;
      }

      // If delete failed server-side, fall through to fallback below
    } catch (e) {
      console.error('Remove failed:', e);
    }

    // fallback to localStorage
    try {
      const favs = JSON.parse(window.localStorage.getItem('favorites') || '[]');
      const next = favs.filter((f) => f.title !== title);
      window.localStorage.setItem('favorites', JSON.stringify(next));
      setFavorites(next);
      setFavoritesCount(next.length);
      return true;
    } catch (e) {
      console.error('Local remove failed:', e);
      return false;
    }
  }, [token, fetchFavorites]);

  const removeByTitle = useCallback(async (title) => {
    const found = favorites.find((f) => f.title === title);
    if (found) return removeRecipe(found.id, found.title);

    // fallback localStorage removal
    try {
      const favs = JSON.parse(window.localStorage.getItem('favorites') || '[]');
      const next = favs.filter((f) => f.title !== title);
      window.localStorage.setItem('favorites', JSON.stringify(next));
      setFavorites(next);
      setFavoritesCount(next.length);
      return true;
    } catch (e) {
      return false;
    }
  }, [favorites, removeRecipe]);

  const handleAuthSuccess = (userData) => {
    setToken(userData.token);
    window.localStorage.setItem('token', userData.token);
    setAuthUser({ id: userData.id, username: userData.username });
    setShowWelcome(false);
    setAuthError(null);
    
    // Clear any cached favorites from previous sessions
    try {
      window.localStorage.removeItem('favorites');
    } catch (e) {}
    
    // Fetch favorites after successful auth
    setTimeout(() => {
      fetchFavorites(userData.token);
    }, 100);
  };

  const logout = () => {
    setToken(null);
    setAuthUser(null);
    window.localStorage.removeItem('token');
    setShowWelcome(true);
    setRecipes([]);
    setFavorites([]);
    setFavoritesCount(0);
  };

  const getRecipes = async (query) => {
    const q = query || searchTerm;
    setIsLoading(true);
    setError(null);

    try {
      // Using TheMealDB API (free, no API key required)
      const apiUrl = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(q)}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(apiUrl, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform TheMealDB format to match existing Recipe component
      const transformedRecipes = (data.meals || []).map(meal => ({
        recipe: {
          uri: meal.idMeal,
          label: meal.strMeal,
          image: meal.strMealThumb,
          calories: Math.floor(Math.random() * 400) + 200, // TheMealDB doesn't provide calories
          ingredients: Array.from({length: 20}, (_, i) => {
            const ingredient = meal[`strIngredient${i + 1}`];
            const measure = meal[`strMeasure${i + 1}`];
            return ingredient && ingredient.trim() ? {
              text: `${measure || ''} ${ingredient}`.trim(),
              food: ingredient
            } : null;
          }).filter(Boolean)
        }
      }));
      
      setRecipes(transformedRecipes);
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timed out. Please check your internet connection and try again.');
      } else {
        setError(err.message || 'Failed to fetch recipes');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Don't auto-fetch recipes on page load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showWelcome]);

  const handleSearch = (event) => setSearchTerm(event.target.value);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setHasSearched(true);
    setShowSuggestions(false);
    getRecipes(searchTerm);
  };

  // Show welcome page if user is not authenticated
  if (showWelcome) {
    return (
      <WelcomePage 
        onAuthSuccess={handleAuthSuccess}
        isLoading={isAuthLoading}
        setIsLoading={setIsAuthLoading}
        error={authError}
        setError={setAuthError}
      />
    );
  }

  return (
    <div className="App">
      <header className="header">
        <div className="brand" onClick={goHome}>
          <div className="logo">R</div>
          <h1>Recipe Haven</h1>
        </div>

        <form className="search-form" onSubmit={handleSearchSubmit}>
          <div className="search-input-wrap">
            <input
              className={`search-bar ${isSearchFocused ? 'focused' : ''}`}
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              onFocus={() => { setIsSearchFocused(true); setShowSuggestions(true); }}
              onBlur={() => setTimeout(() => { setIsSearchFocused(false); setShowSuggestions(false); }, 150)}
              placeholder="Search recipes, e.g. chicken, pasta, salad"
              autoComplete="off"
            />

            {showSuggestions && (
              <div className="search-suggestions" role="listbox">
                {(() => {
                  const term = (searchTerm || '').trim();
                  const filtered = SEARCH_SUGGESTIONS.filter(s => s.toLowerCase().includes(term.toLowerCase()));

                  if (term) {
                    const uniqueList = [term, ...filtered.filter(s => s.toLowerCase() !== term.toLowerCase())];
                    return uniqueList.map((s, idx) => (
                      <div
                        key={`${s}-${idx}`}
                        className="search-suggestion-item"
                        onMouseDown={(e) => { e.preventDefault(); setSearchTerm(s); setHasSearched(true); getRecipes(s); setShowSuggestions(false); }}
                      >
                        {idx === 0 ? (
                          <span>Search for "{s}"</span>
                        ) : s}
                      </div>
                    ));
                  }

                  if (filtered.length === 0) {
                    return <div className="search-suggestion-no">No suggestions</div>;
                  }

                  return filtered.map(s => (
                    <div
                      key={s}
                      className="search-suggestion-item"
                      onMouseDown={(e) => { e.preventDefault(); setSearchTerm(s); setHasSearched(true); getRecipes(s); setShowSuggestions(false); }}
                    >
                      {s}
                    </div>
                  ));
                })()
                }
              </div>
            )}
          </div>

          <div className="controls">
            <button className="search-button" type="submit" disabled={isLoading}>
              {isLoading ? '🔍 Searching...' : '🔍 Search'}
            </button>
            <div 
              className="fav-count interactive" 
              onClick={openSavedModal}
              title="View saved recipes"
            >
              ❤️ {favoritesCount}
            </div>
          </div>
        </form>

        <div className="header-actions">
          <button className="btn home-btn interactive" onClick={goHome} aria-label="Home">🏠</button>

          {authUser && (
            <div className="action-stack" role="group" aria-label="User actions">
              <button className="btn interactive" onClick={openCreateModal} title="Create a new recipe">➕ New Recipe</button>
              <button className="btn interactive" onClick={openMyRecipesModal} title="View my recipes">📝 My Recipes</button>
            </div>
          )}
        </div>

        <div className="auth-controls">
          {authUser && (
            <div className="auth-area">
              <span className="auth-user">Hi, {authUser.username}</span>
              <button className="btn" type="button" onClick={logout}>Logout</button>
            </div>
          )}
        </div>
      </header>

      {isLoading && (
        <div className="empty-card loading">
          <div style={{fontSize: '2rem', marginBottom: '16px'}}>🍳</div>
          <div>Searching for delicious recipes...</div>
          <div style={{fontSize: '0.9rem', opacity: '0.7', marginTop: '8px'}}>This might take a moment</div>
        </div>
      )}
      
      {error && (
        <div className="empty-card" style={{borderColor: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)'}}>
          <div style={{fontSize: '2rem', marginBottom: '16px'}}>⚠️</div>
          <div>Oops! Something went wrong</div>
          <div style={{fontSize: '0.9rem', opacity: '0.8', marginTop: '8px'}}>{error}</div>
          <div style={{display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'center'}}>
            <button 
              className="btn" 
              onClick={() => getRecipes(searchTerm)}
            >
              🔄 Try Again
            </button>
            <button 
              className="btn" 
              onClick={() => {
                console.log('Testing API with "chicken"...');
                setSearchTerm('chicken');
                getRecipes('chicken');
              }}
            >
              🍗 Test with Chicken
            </button>
          </div>
        </div>
      )}

      <div className="recipes">
        {recipes.length === 0 && !isLoading && !error && (
          authUser ? (
            showFirstTimeGreeting ? (
              <div className="empty-card welcome-card">
                <div style={{fontSize: '1.6rem', marginBottom: '12px'}}>Welcome, <strong style={{color: 'var(--accent)'}}>{authUser.username}</strong>! 🎉</div>
                <div style={{fontSize: '1rem', opacity: '0.9'}}>Thanks for joining Recipe Haven — start by saving a few recipes or creating your first one.</div>

                <div style={{display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'center', flexWrap: 'wrap'}}>
                  <button className="btn" onClick={() => { setSearchTerm('chicken'); getRecipes('chicken'); }}>🔍 Explore Popular</button>
                  <button className="btn" onClick={openCreateModal}>➕ Create a Recipe</button>
                  <button className="btn" onClick={openSavedModal}>❤️ View Saved ({favoritesCount})</button>
                </div>

                <div style={{display: 'flex', justifyContent: 'center', gap: '8px', marginTop: 12}}>
                  <button className="btn" onClick={dismissFirstTimeGreeting}>Got it</button>
                </div>
              </div>
            ) : (
              <div className="empty-card">
                {hasSearched && searchTerm ? (
                  <>
                    <div style={{fontSize: '1.6rem', marginBottom: '8px'}}>No results for "{searchTerm}"</div>
                    <div style={{fontSize: '1rem', opacity: '0.9'}}>Try different search terms or browse popular categories below.</div>

                    <div style={{display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'center', flexWrap: 'wrap'}}>
                      {SEARCH_SUGGESTIONS.map((s) => (
                        <button key={s} className="btn" onClick={() => { setSearchTerm(s); setHasSearched(true); getRecipes(s); }}>{s}</button>
                      ))}
                      <button className="btn" onClick={() => { setSearchTerm(''); setHasSearched(false); }}>Clear search</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{fontSize: '1.6rem', marginBottom: '8px'}}>Ready to cook?</div>
                    <div style={{fontSize: '1rem', opacity: '0.9'}}>Search for recipes, explore popular choices, or manage your saved recipes.</div>

                    <div style={{display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'center', flexWrap: 'wrap'}}>
                      <button className="btn" onClick={() => { setSearchTerm('chicken'); getRecipes('chicken'); }}>🔍 Explore Popular</button>
                      <button className="btn" onClick={openCreateModal}>➕ Create a Recipe</button>
                      <button className="btn" onClick={openSavedModal}>❤️ View Saved ({favoritesCount})</button>
                    </div>
                  </>
                )}
              </div>
            )
          ) : (
            <div className="empty-card">
              {hasSearched && searchTerm ? (
                <>
                  <div style={{fontSize: '1.6rem', marginBottom: '8px'}}>No results for "{searchTerm}"</div>
                  <div style={{fontSize: '0.95rem', opacity: '0.85'}}>We couldn't find recipes matching your search. Try different keywords or browse popular categories below.</div>

                  <div style={{display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center'}}>
                    {SEARCH_SUGGESTIONS.map((suggestion) => (
                      <button 
                        key={suggestion}
                        className="btn"
                        style={{fontSize: '0.9rem', padding: '8px 14px'}}
                        onClick={() => { setSearchTerm(suggestion); setHasSearched(true); getRecipes(suggestion); }}
                      >{suggestion}</button>
                    ))}
                    <button className="btn" onClick={() => { setSearchTerm(''); setHasSearched(false); }} style={{background:'rgba(255,255,255,0.06)'}}>Clear search</button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{fontSize: '2.6rem', marginBottom: '12px'}}>Welcome to Recipe Haven</div>
                  <div style={{fontSize: '1rem', opacity: '0.85'}}>Sign up to save recipes and create your own. Or start exploring with the buttons below.</div>

                  <div style={{display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center'}}>
                    {SEARCH_SUGGESTIONS.map((suggestion) => (
                      <button 
                        key={suggestion}
                        className="btn"
                        style={{fontSize: '0.9rem', padding: '8px 14px'}}
                        onClick={() => { setSearchTerm(suggestion); getRecipes(suggestion); }}
                      >{suggestion}</button>
                    ))}
                  </div>

                  <div style={{fontSize: '0.85rem', opacity: '0.7', marginTop: 12}}>Tip: Try searching for "pasta" or "dessert" to get inspiration.</div>
                </>
              )}
            </div>
          )
        )}

        {recipes.map((recipeItem) => (
          <Recipe
            key={recipeItem.recipe.uri}
            title={recipeItem.recipe.label}
            calories={recipeItem.recipe.calories}
            image={recipeItem.recipe.image}
            ingredients={recipeItem.recipe.ingredients}
            saved={favorites.some((f) => f.title === recipeItem.recipe.label)}
            onSave={saveRecipe}
            onRemove={removeByTitle}
          />
        ))}


      </div>

      {/* Modals */}
      {showSaved && (
        <SavedRecipes 
          open={showSaved} 
          onClose={() => setShowSaved(false)} 
          favorites={favorites} 
          token={token} 
          refresh={fetchFavorites} 
        />
      )}

      {showMyRecipes && (
        <MyRecipes 
          open={showMyRecipes} 
          onClose={() => setShowMyRecipes(false)} 
          token={token} 
          refresh={fetchFavorites} 
        />
      )}

      {showCreate && (
        <CreateRecipeModal 
          open={showCreate} 
          onClose={() => setShowCreate(false)} 
          token={token} 
          onCreated={async () => {
            await fetchFavorites();
            setShowCreate(false);
          }} 
        />
      )}

      <div className="footer-note">
        <div style={{fontSize: '0.85rem', opacity: '0.6'}}>© Recipe Haven</div>
      </div>
    </div>
  );
};

export default App;

