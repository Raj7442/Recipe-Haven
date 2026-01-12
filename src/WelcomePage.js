import React, { useState } from "react";
import "./WelcomePage.css";

const WelcomePage = ({
  onAuthSuccess,
  isLoading,
  setIsLoading,
  error,
  setError,
}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const calculateStrength = (pw) => {
    let score = 0;
    if (!pw) return 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return Math.min(3, score);
  };

  const strengthLabels = ["", "Weak", "Fair", "Strong"];
  const passwordStrength = calculateStrength(password);
  const passwordStrengthLabel = strengthLabels[passwordStrength];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!isLogin && passwordStrength < 3) {
      setError("Please choose a stronger password: min 8 chars, include uppercase, number and symbol.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || `${isLogin ? "Login" : "Signup"} failed`);
        return;
      }

      onAuthSuccess(data);
    } catch (err) {
      setError(`Connection failed. Make sure the server is running.`);
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (next) => {
    const target = typeof next === 'boolean' ? next : !isLogin;
    setIsLogin(target);
    setError(null);
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
  };

  const canSubmit = isLogin ? (username && password) : (username && password && confirmPassword && password === confirmPassword);

  return (
    <div className="welcome-page">
      <div className="welcome-background">
        {["🍕", "🍝", "🥗", "🍰", "🍜", "🥘"].map((f, i) => (
          <div key={i} className="floating-food">{f}</div>
        ))}
      </div>

      <div className="welcome-container">
        {/* Hero Section */}
        <div className="hero-section">
          <div className="logo-container">
            <div className="logo-icon">RH</div>
            <div className="brand-info">
              <h1 className="brand-title">Recipe Haven</h1>
              <span className="dev-badge">Developed by Rounak</span>
            </div>
          </div>
          
          <p className="hero-subtitle">
            Discover, save, and create amazing recipes from around the world
          </p>

          <div className="feature-chips">
            <div className="chip">🔍 Smart Search</div>
            <div className="chip">❤️ Save & Sync</div>
            <div className="chip">✍️ Create & Share</div>
          </div>
        </div>

        {/* Auth Section */}
        <div className="auth-section">
          <div className="auth-card">
            <div className="auth-tabs">
              <button
                className={`auth-tab ${isLogin ? "active" : ""}`}
                onClick={() => switchMode(true)}
              >
                Sign In
              </button>
              <button
                className={`auth-tab ${!isLogin ? "active" : ""}`}
                onClick={() => switchMode(false)}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Username</label>
                <input
                  className="form-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  placeholder="Enter your username"
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <div className="password-field">
                  <input
                    className="form-input"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="show-pass-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "🐵" : "🙈"}
                  </button>
                </div>

                {!isLogin && password && (
                  <div className="strength-meter">
                    <div className={`strength-bar s${passwordStrength}`}></div>
                    <span className="strength-label">{passwordStrengthLabel}</span>
                  </div>
                )}
              </div>

              {!isLogin && (
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    className="form-input"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    placeholder="Confirm your password"
                  />
                </div>
              )}

              {error && <div className="error-message">⚠️ {error}</div>}

              <div className="auth-actions">
                <button type="submit" disabled={isLoading || !canSubmit} className="auth-submit-btn">
                  {isLoading
                    ? isLogin
                      ? "Signing In..."
                      : "Creating Account..."
                    : isLogin
                    ? "🚀 Sign In"
                    : "✨ Create Account"}
                </button>
              </div>
            </form>

            <div className="auth-switch">
              <p>
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button onClick={switchMode} className="switch-btn">
                  {isLogin ? "Sign up here" : "Sign in here"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
