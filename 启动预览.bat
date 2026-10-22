@echo off
setlocal
chcp 65001 >nul
pushd "%~dp0"
if errorlevel 1 goto folder_error

py -3 -c "import sys; sys.exit(0 if sys.version_info >= (3, 8) else 1)" >nul 2>&1
if not errorlevel 1 goto launch_py
python -c "import sys; sys.exit(0 if sys.version_info >= (3, 8) else 1)" >nul 2>&1
if not errorlevel 1 goto launch_python

echo Python 3.8 or newer was not found.
echo Install Python from https://www.python.org/downloads/windows/
echo Enable the Python launcher or add Python to PATH, then run this file again.
echo You can also open index.html and choose the project folder for 3D previews.
popd
pause
exit /b 1

:launch_py
py -3 -X utf8 scripts\preview-server.py
set "VAULT_EXIT=%errorlevel%"
goto finish

:launch_python
python -X utf8 scripts\preview-server.py
set "VAULT_EXIT=%errorlevel%"
goto finish

:finish
popd
if not "%VAULT_EXIT%"=="0" pause
exit /b %VAULT_EXIT%

:folder_error
echo Cannot open the project folder. Keep this launcher with index.html and scripts.
pause
exit /b 1
