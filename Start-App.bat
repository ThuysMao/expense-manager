@echo off
title Expense Manager Server
color 0A

echo =========================================
echo       KHOI DONG EXPENSE MANAGER...
echo =========================================
echo.
echo - Dang mo server...
echo - Se tu dong mo trinh duyet sau vai giay...
echo.
echo Luu y: Khong tat cua so nay trong qua trinh su dung!
echo Thu nho cua so nay xuong Taskbar de tiep tuc.
echo =========================================

cd backend
start http://localhost:5000
python server.py

pause
