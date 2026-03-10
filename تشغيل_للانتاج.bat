@echo off
set "PATH=C:\Program Files\Python312;C:\Program Files\Python312\Scripts;%PATH%"
echo Starting ZonaAI PRODUCTION Backend...
start http://127.0.0.1:8000
"C:\Program Files\Python312\python.exe" -m uvicorn backend:app --host 0.0.0.0 --port 8000 --workers 4
pause
