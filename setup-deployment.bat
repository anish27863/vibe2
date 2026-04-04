@echo off
REM Script to prepare the project for Vercel deployment

echo ========================================
echo SmartRoute - Vercel Deployment Setup
echo ========================================
echo.

REM Create public directory
echo [1/3] Creating public directory...
if not exist "public" mkdir "public"
echo Done!
echo.

REM Create a simple favicon placeholder
echo [2/3] Creating favicon placeholder...
echo ^<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"^>^<rect width="100" height="100" rx="20" fill="#6366f1"/^>^<path d="M30 70 L50 30 L70 70" stroke="white" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/^>^<circle cx="50" cy="40" r="4" fill="white"/^>^<circle cx="40" cy="60" r="4" fill="white"/^>^<circle cx="60" cy="60" r="4" fill="white"/^>^</svg^> > "public\icon.svg"
echo Done!
echo.

echo [3/3] Setup complete!
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo 1. Get API keys (see VERCEL_CHECKLIST.md)
echo 2. Push to GitHub
echo 3. Deploy on Vercel
echo 4. Add environment variables
echo ========================================
echo.
echo For detailed instructions, open:
echo - VERCEL_CHECKLIST.md
echo - DEPLOYMENT_SUMMARY.md
echo.
pause
