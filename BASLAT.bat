@echo off
title OnkoMobil - Expo Dev Server
cd /d "%~dp0"
echo.
echo  ==========================================
echo   OnkoMobil - Expo Gelistirme Sunucusu
echo  ==========================================
echo.
echo  Sunucu baslatiliyor...
echo  QR kodu gorununce telefonda Expo Go ile tarayin.
echo  Telefon ve bilgisayar ayni Wi-Fi aginda olmali.
echo.
set NODE_TLS_REJECT_UNAUTHORIZED=0
set REACT_NATIVE_PACKAGER_HOSTNAME=10.243.11.92
npx expo start --clear
pause
