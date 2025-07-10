@echo off
echo Starting GameDin L3 Optimized Network...
echo C:\ Drive: Development and Scripting
echo M:\ Drive: Database and Heavy Storage
echo.

echo [1/6] Starting Blockchain Node (C:\ drive)...
start "Blockchain Node" cmd /k "cd /d C:\GameDin-L3-Development && npx hardhat node --network hardhat"

echo [2/6] Starting AI Services (C:\ drive)...
start "NovaSanctum AI" cmd /k "cd /d C:\GameDin-L3-Development\ai-services && node nova-sanctum-service.js"
start "AthenaMist AI" cmd /k "cd /d C:\GameDin-L3-Development\ai-services && node athena-mist-service.js"
start "Unified AI" cmd /k "cd /d C:\GameDin-L3-Development\ai-services && node unified-ai-service.js"

echo [3/6] Starting WebSocket Gaming Server (C:\ drive)...
start "Gaming Server" cmd /k "cd /d C:\GameDin-L3-Development && node websocket-server.js"

echo [4/6] Starting Monitoring Dashboard (C:\ drive)...
start "Monitoring" cmd /k "cd /d C:\GameDin-L3-Development\monitoring && node monitoring-dashboard.js"

echo [5/6] Starting Frontend (C:\ drive)...
start "Frontend" cmd /k "cd /d C:\GameDin-L3-Development\frontend && npm start"

echo [6/6] Starting Database Services (M:\ drive)...
start "Database" cmd /k "cd /d M:\GameDin-L3-Storage\database && node database-service.js"

echo.
echo GameDin L3 Optimized Network started successfully!
echo.
echo Services:
echo - Blockchain: http://localhost:8545 (C:\ drive)
echo - AI Services: http://localhost:3000-3002 (C:\ drive)
echo - Gaming Server: ws://localhost:8080 (C:\ drive)
echo - Monitoring: http://localhost:4000 (C:\ drive)
echo - Frontend: http://localhost:3000 (C:\ drive)
echo - Database: M:\GameDin-L3-Storage\database (M:\ drive)
echo.
pause 