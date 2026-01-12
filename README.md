# Recipe Haven

Recipe Haven is a user-friendly food recipe app built with React.js. It allows users to browse and explore a wide variety of recipes fetched from an external API. Each recipe is presented in detail, including ingredients, cooking instructions, and nutritional information like calorie content.

## Features

- **Dynamic Recipe Fetching**: Recipes are fetched from a public API and displayed dynamically in the app.
- **Detailed Recipe View**: Each recipe includes comprehensive details such as ingredients, preparation steps, and calorie information.
- **Responsive Design**: The app is designed to be fully responsive, providing a seamless experience across different devices.

## Technologies Used

- **Frontend**: React.js, JavaScript (ES6), HTML, CSS
- **Data Fetching**: RESTful API
- **State Management**: React Hooks (useState, useEffect)

## Getting Started

### Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)

## UI updates (Modern, interactive)

- Updated to a modern, responsive card-based UI with hover overlays and interactive buttons.
- Each recipe card includes:
  - Image with hover overlay
  - Buttons: View (opens modal with ingredients), Save (stores to localStorage), Copy (copies title)
  - Calories badge and ingredient count
- Favorites are stored locally in `localStorage` and shown as a count in the header.

## Environment variables (Edamam API)

1. Create a `.env` file at the project root (do not commit it).
2. Add:
```
REACT_APP_EDAMAM_ID=your_edamam_app_id
REACT_APP_EDAMAM_KEY=your_edamam_app_key
```
3. Get credentials from https://developer.edamam.com/

## Social Authentication (Optional)

You can enable social sign-in (Google/GitHub) by setting OAuth entry points that your backend or OAuth provider redirects to. The app expects the following environment variables in your `.env` (or in Railway/Host settings):

```
REACT_APP_GOOGLE_AUTH_URL=https://your-server.com/auth/google
REACT_APP_GITHUB_AUTH_URL=https://your-server.com/auth/github
```

For local testing without a backend you can point these to the included simulator page:

```
REACT_APP_GOOGLE_AUTH_URL=http://localhost:3000/oauth-sim.html?token=demo-google
REACT_APP_GITHUB_AUTH_URL=http://localhost:3000/oauth-sim.html?token=demo-github
```

How it works:
- Clicking a social button opens a popup to the configured URL.
- After authentication your server (or the simulator page) should redirect to a page that posts a message back to the main window with an object containing at least `{ token, username, id }`.
- For local testing use the simulator at `public/oauth-sim.html` which will send a demo token back to the opener so you can test the popup flow.

If you see “not configured” messages under the social buttons, set the two env vars above and restart the dev server (`npm start`).

## Deploying to Railway

- Option 1 (Static): Use Railway's Static Site — Build Command: `npm run build`, Publish Directory: `build`.
- Option 2 (Node server): We included `server.js` and `express`; Railway can run `npm start` (which runs `node server.js`). Set env vars in Railway Variables.

## Backend (Postgres) — added API

This project now includes a Postgres-backed API to store user recipes. It uses the `DATABASE_URL` env var (Railway Postgres provides this automatically).

Authentication & JWT
- Add `JWT_SECRET` to your environment (see `.env.example`).
- Endpoints for auth are:
  - `POST /api/auth/signup` — body `{ username, password }` → returns `{ token, id, username }`
  - `POST /api/auth/login` — body `{ username, password }` → returns `{ token, id, username }`
  - `GET /api/auth/me` — requires `Authorization: Bearer <token>` → returns `{ id, username }`

Protected API endpoints (use Authorization header with token):
- GET `/api/recipes` — list recipes for authenticated user
- GET `/api/recipes/count` — returns `{ count: n }`
- POST `/api/recipes` — body `{ title, image, calories, ingredients }` (server uses authenticated user id)
- PUT `/api/recipes/:id` — body `{ title?, image?, calories?, ingredients? }` (authenticated only)
- DELETE `/api/recipes/:id` — authenticated only

Setup locally:
1. Install dependencies: `npm install` (adds `pg`, `bcryptjs`, `jsonwebtoken`)
2. Set `DATABASE_URL` pointing to a Postgres instance (e.g., `postgres://user:pass@localhost:5432/yourdb`) and `JWT_SECRET`.
3. Start server: `npm start` (server will auto-create the `recipes` and `users` tables on first run)

Note: The frontend supports anonymous (localStorage) saves and authenticated saves. For multi-device/wider user support, sign up and log in; saved recipes will be tied to your account.

Create / manage recipes: Logged-in users can create new recipes using the **New Recipe** button in the header, and edit or delete their saved recipes from the Saved Recipes view.


