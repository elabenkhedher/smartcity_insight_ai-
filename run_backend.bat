@echo off
echo =====================================================================
echo  Protection Civile Tunis - Backend Django Channels & REST API (8000)
echo =====================================================================
cd /d "%~dp0"
call .\venv\Scripts\activate.bat
python -m daphne -b 127.0.0.1 -p 8000 config.asgi:application
pause
