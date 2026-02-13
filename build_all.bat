@echo off
echo ==========================================
echo      CONSTRUYENDO APLICACION COMPLETA
echo ==========================================

echo ==========================================
echo      LIMPIANDO ARCHIVOS ANTERIORES
echo ==========================================
if exist "frontend\dist" rmdir /s /q "frontend\dist"
if exist "backend\dist" rmdir /s /q "backend\dist"
if exist "backend\release" rmdir /s /q "backend\release"
if exist "backend\frontend-build" rmdir /s /q "backend\frontend-build"

echo.
echo [1/3] CONSTRUYENDO FRONTEND...
cd frontend
call npm install
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Fallo al construir el frontend.
    exit /b %errorlevel%
)
cd ..

echo.
echo [2/3] COPIANDO ARCHIVOS DEL FRONTEND...
echo Limpiando directorio de destino...
if exist "backend\frontend-build" rmdir /s /q "backend\frontend-build"
mkdir "backend\frontend-build"

echo Copiando archivos...
xcopy "frontend\dist" "backend\frontend-build" /E /I /Y
if %errorlevel% neq 0 (
    echo ERROR: Fallo al copiar archivos del frontend.
    exit /b %errorlevel%
)

echo.
echo [3/3] CONSTRUYENDO Y EMPAQUETANDO BACKEND (ELECTRON)...
cd backend
call npm install
call npm run dist
if %errorlevel% neq 0 (
    echo ERROR: Fallo al empaquetar la aplicacion.
    exit /b %errorlevel%
)
cd ..

echo.
echo ==========================================
echo      CONSTRUCCION COMPLETADA CON EXITO
echo      El instalador esta en backend/release
echo ==========================================
