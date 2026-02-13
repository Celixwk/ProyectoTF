@echo off
echo Eliminando procesos bloqueados...
taskkill /F /IM "Sistema de Nómina.exe" /T
taskkill /F /IM electron.exe /T
taskkill /F /IM postgres.exe /T
taskkill /F /IM node.exe /T
echo.
echo Intentando limpiar carpetas...
if exist "backend\release" rmdir /s /q "backend\release"
if exist "backend\frontend-build" rmdir /s /q "backend\frontend-build"
echo.
echo Listo. Si viste errores de "Acceso denegado", ejecuta este archivo como ADMINISTRADOR.
pause
