@echo off
echo ============================================
echo  TaiLand Cafe - Cai dat tu khoi dong cung Windows
echo ============================================

set TASKNAME=TaiLandCafeServer
set VBSPATH=D:\F2WIN\AI\PROJECT\CLAUDE_CODE_01\tailand-cafe\scripts\start-hidden.vbs

schtasks /Create /TN "%TASKNAME%" /TR "wscript.exe \"%VBSPATH%\"" /SC ONLOGON /RL LIMITED /F

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [OK] Da cai dat thanh cong!
    echo Website se tu dong chay tai http://localhost:3000 moi khi dang nhap Windows.
    echo.
    echo Dang khoi chay ngay bay gio de kiem tra...
    wscript.exe "%VBSPATH%"
    timeout /t 3 /nobreak >nul
    echo Mo trinh duyet de kiem tra: http://localhost:3000
) else (
    echo.
    echo [LOI] Cai dat that bai. Hay thu chay file nay bang quyen Administrator.
)
pause
