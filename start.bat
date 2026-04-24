@echo off
echo Iniciando ML Intelligence...

echo.
echo [1/2] Iniciando backend Python...
start "Backend" cmd /k "cd backend && pip install -r requirements.txt && uvicorn main:app --reload --port 8000"

timeout /t 3 /nobreak > nul

echo [2/2] Iniciando frontend Next.js...
start "Frontend" cmd /k "cd frontend && npm install && npm run dev"

echo.
echo Acesse: http://localhost:3000
echo API Docs: http://localhost:8000/docs
