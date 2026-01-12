@echo off
echo ========================================
echo Recipe Haven - Database Setup
echo ========================================
echo.
echo This script will help you set up PostgreSQL for Recipe Haven
echo.
echo OPTION 1: Using Docker (Recommended)
echo ----------------------------------------
echo If you have Docker installed, run:
echo docker run --name recipe-haven-db -e POSTGRES_PASSWORD=password123 -e POSTGRES_DB=recipe_haven -p 5433:5432 -d postgres:13
echo.
echo OPTION 2: Local PostgreSQL Installation
echo ----------------------------------------
echo 1. Install PostgreSQL from: https://www.postgresql.org/download/windows/
echo 2. Create a database named 'recipe_haven'
echo 3. Update the DATABASE_URL in .env file
echo.
echo Current DATABASE_URL in .env:
type .env | findstr DATABASE_URL
echo.
echo ========================================
echo After setting up the database, restart the server with:
echo npm run start
echo ========================================
pause