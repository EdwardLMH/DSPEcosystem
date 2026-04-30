@echo off
@rem Gradle startup script for Windows
set SCRIPT_DIR=%~dp0
if exist "%SCRIPT_DIR%\gradle\wrapper\gradle-wrapper.jar" (
  java -jar "%SCRIPT_DIR%\gradle\wrapper\gradle-wrapper.jar" %*
) else (
  gradle %*
)
