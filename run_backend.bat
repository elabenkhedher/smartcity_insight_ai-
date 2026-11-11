@echo off
title SmartCity Insight AI - Backend Daphne ASGI (Etudiant 3)
echo =========================================================================
echo Demarrage du Backend Daphne ASGI (Django Channels + Redis)
echo Urgences Temps Reel, Risk Map & Assistant LLM - Etudiant 3
echo =========================================================================
call .\venv\Scripts\activate
python manage.py migrate
python -m daphne -b 127.0.0.1 -p 8000 config.asgi:application
pause
