# Recipe Haven - Troubleshooting Guide

## Issues Fixed

### 1. Recipe Search "Failed to fetch" Error
**Problem**: The app was using an outdated Edamam API endpoint.

**Solution**: Updated the API endpoint from the old v1 to the current v2 format:
- Old: `https://api.edamam.com/search?q=...`
- New: `https://api.edamam.com/api/recipes/v2?type=public&q=...`

### 2. Modal Overlap Issues
**Problem**: The "New Recipes" and "My Recipes" modals were overlapping with the main page content.

**Solution**: Fixed z-index values and modal positioning:
- Main modals: z-index 1000-1001
- Edit/View overlays: z-index 1100-1101
- Improved backdrop styling and positioning

## How to Start the Application

### Option 1: Development Mode (Recommended for development)
1. Double-click `start-dev-mode.bat`
2. This will start both:
   - React development server on http://localhost:3000
   - Express backend server on http://localhost:3002

### Option 2: Production Mode
1. Double-click `start-dev.bat`
2. This builds the React app and serves it from the Express server on http://localhost:3002

### Manual Setup
```bash
# Install dependencies
npm install

# For development (runs both client and server)
npm run start-client  # In one terminal
node server.js        # In another terminal

# For production
npm run build
npm start
```

## API Configuration

Your `.env` file already contains valid Edamam API credentials:
```
REACT_APP_EDAMAM_ID=461bb513
REACT_APP_EDAMAM_KEY=df85684f368109bfece3690e28836287
```

## Testing the Fix

1. Start the application using one of the methods above
2. Log in or create an account
3. Try searching for "chicken" or any other recipe
4. The search should now work without the "Failed to fetch" error
5. Click on "New Recipe" or "My Recipes" - the modals should display properly without overlapping

## Additional Features Added

- Better error handling with specific error messages
- Test button for API connectivity
- Improved modal styling and positioning
- Debug logging for API credentials (check browser console)
- Timeout handling for API requests (10 seconds)

## Common Issues

### If you still get "Failed to fetch":
1. Check your internet connection
2. Verify the API credentials in `.env` file
3. Check browser console for detailed error messages
4. Try the "Test with Chicken" button for debugging

### If modals still overlap:
1. Clear browser cache and refresh
2. Check if CSS files are loading properly
3. Ensure you're using the updated version of the files

## Database Setup (Optional)

The app works without a database for basic recipe search. For saving recipes, you'll need PostgreSQL:

1. Install PostgreSQL or use Docker:
   ```bash
   docker-compose up -d
   ```

2. The database will be automatically initialized when you start the server.

## Support

If you encounter any issues:
1. Check the browser console for error messages
2. Check the server terminal for backend errors
3. Ensure all dependencies are installed with `npm install`