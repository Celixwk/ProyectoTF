@echo off
chcp 65001 >nul
echo.
echo ═══════════════════════════════════════════════════════════════
echo  🧪 PRUEBAS DE LA API - Sistema de Nómina
echo ═══════════════════════════════════════════════════════════════
echo.

set "BASE_URL=http://localhost:5000"

echo.
echo ┌─────────────────────────────────────────────────────────────┐
echo │ TEST 1: Health Check                                        │
echo └─────────────────────────────────────────────────────────────┘
curl.exe -s "%BASE_URL%/health" && echo. && echo ✅ Health Check OK || echo ❌ Health Check FALLÓ
echo.

echo.
echo ┌─────────────────────────────────────────────────────────────┐
echo │ TEST 2: Login                                               │
echo └─────────────────────────────────────────────────────────────┘
curl.exe -s -X POST "%BASE_URL%/api/auth/login" -H "Content-Type: application/json" -d "{\"usuario\":\"admin\",\"contrasenia\":\"admin123\"}" 
echo.
echo ✅ Login ejecutado
echo.

echo.
echo 📋 Para hacer más pruebas, consulta la documentación en:
echo    backend/docs/API_DOCUMENTACION.md
echo    backend/docs/PRUEBAS_RAPIDAS.md
echo.

pause

