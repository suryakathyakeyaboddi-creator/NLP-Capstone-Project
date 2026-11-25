@echo off
title NEUROSUM AI - Complete Launcher
cd /d "%~dp0"
echo ========================================================
echo Launching NEUROSUM AI Research System...
echo ========================================================
start "NeuroSum Backend" cmd /k ""%~dp0run_backend.bat""
powershell -Command "Start-Sleep -Seconds 3"
start "NeuroSum Frontend" cmd /k ""%~dp0run_frontend.bat""
powershell -Command "Start-Sleep -Seconds 3"
echo Opening NEUROSUM AI in your default web browser...
start http://localhost:5173
echo ========================================================
echo NEUROSUM AI is now running:
echo - Frontend: http://localhost:5173
echo - Backend API Docs: http://localhost:8000/docs
echo ========================================================
pause
