# Recipe Haven 🍳

[![Live Demo](https://img.shields.io/badge/Live-Demo-success?style=for-the-badge)](https://recipe-haven-production.up.railway.app/)
[![React](https://img.shields.io/badge/React-18.3.1-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)

> **🌐 Live Site:** [https://recipe-haven-production.up.railway.app/](https://recipe-haven-production.up.railway.app/)

A modern, full-stack food recipe application built with React.js and Node.js. Browse thousands of recipes, save your favorites, and create your own custom recipes with user authentication and database persistence.

---

## ✨ Features

- 🔍 **Recipe Search** - Search thousands of recipes from TheMealDB API
- 💾 **Save Favorites** - Save recipes to your account with database persistence
- ✏️ **Create Recipes** - Create and manage your own custom recipes
- 🔐 **User Authentication** - Secure JWT-based authentication system
- 📱 **Responsive Design** - Seamless experience across all devices
- 🎨 **Modern UI** - Clean, interactive card-based interface
- ⚡ **Real-time Updates** - Instant feedback and live search

---

## 🚀 Technologies Used

### Frontend
- **React.js** - UI framework
- **JavaScript (ES6+)** - Programming language
- **CSS3** - Styling and animations
- **React Hooks** - State management (useState, useEffect, useCallback)

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web server framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### API
- **TheMealDB API** - Free recipe data (no API key required)

### Deployment
- **Railway** - Cloud hosting platform
- **GitHub** - Version control

---

## 🎯 Live Demo

**Visit the live application:** [https://recipe-haven-production.up.railway.app/](https://recipe-haven-production.up.railway.app/)

### Try it out:
1. Sign up for a free account
2. Search for recipes (try "chicken" or "pasta")
3. Save your favorite recipes
4. Create your own custom recipes
5. Edit and manage your recipe collection

---

## 🛠️ Local Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [PostgreSQL](https://www.postgresql.org/) (for database)
- [npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/Raj7442/Recipe-Haven---Food-Recipe-App..git
cd Recipe-Haven---Food-Recipe-App.-main
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**

Create a `.env` file in the root directory:
```env
# Database (PostgreSQL)
DATABASE_URL=postgres://user:password@localhost:5432/recipe_haven

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your_jwt_secret_here

# Environment
NODE_ENV=development
```

4. **Start the development servers:**

**Option 1: Use the batch file (Windows):**
```bash
start-dev-mode.bat
```

**Option 2: Manual start (two terminals):**

Terminal 1 - Backend:
```bash
node server.js
```

Terminal 2 - Frontend:
```bash
npm run start-client
```

5. **Open your browser:**
```
http://localhost:3000
```

---

## 📦 Available Scripts

```bash
npm start              # Start production server
npm run start-client   # Start React dev server (port 3000)
npm run build          # Build for production
npm test              # Run tests
```

---

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Recipes Table
```sql
CREATE TABLE recipes (
  id SERIAL PRIMARY KEY,
  owner_id TEXT NOT NULL,
  title TEXT NOT NULL,
  image TEXT,
  calories NUMERIC,
  ingredients JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login to account
- `GET /api/auth/me` - Get current user (requires auth)

### Recipes (Protected)
- `GET /api/recipes` - Get user's recipes
- `GET /api/recipes/count` - Get recipe count
- `POST /api/recipes` - Create new recipe
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe

### Health Check
- `GET /health` - Server health status

---

## 🚢 Deployment

### Deploy to Railway

1. **Push to GitHub:**
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **Create Railway Project:**
- Go to [railway.app](https://railway.app)
- Click "New Project" → "Deploy from GitHub repo"
- Select your repository

3. **Add PostgreSQL Database:**
- Click "+ New" → "Database" → "PostgreSQL"
- `DATABASE_URL` is automatically configured

4. **Set Environment Variables:**
```
NODE_ENV=production
JWT_SECRET=<your-generated-secret>
```

5. **Deploy:**
- Railway automatically builds and deploys
- Generate domain to get your live URL

---

## 🎨 Features in Detail

### User Authentication
- Secure JWT-based authentication
- Password hashing with bcryptjs
- Persistent login sessions
- Protected routes and API endpoints

### Recipe Management
- Search recipes from TheMealDB API
- Save recipes to your account
- Create custom recipes with ingredients
- Edit and delete your recipes
- View detailed recipe information

### Modern UI/UX
- Responsive card-based layout
- Interactive hover effects
- Modal dialogs for recipe details
- Real-time search suggestions
- Loading states and error handling
- Smooth animations and transitions

---

## 📝 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Environment (development/production) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret key for JWT tokens |
| `PORT` | No | Server port (default: 3002) |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👨‍💻 Author

**Raj**
- GitHub: [@Raj7442](https://github.com/Raj7442)

---

## 🙏 Acknowledgments

- [TheMealDB](https://www.themealdb.com/) - Free recipe API
- [Railway](https://railway.app/) - Hosting platform
- [React](https://reactjs.org/) - Frontend framework
- [PostgreSQL](https://www.postgresql.org/) - Database

---

## 📞 Support

If you have any questions or need help, please open an issue on GitHub.

---

**⭐ Star this repository if you found it helpful!**

**🌐 Live Demo:** [https://recipe-haven-production.up.railway.app/](https://recipe-haven-production.up.railway.app/)
