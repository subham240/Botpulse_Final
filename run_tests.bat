@echo off
chcp 65001 > nul
title BotPulse AI Agent Detection Test Suite
:menu
cls
echo ========================================================================
echo   🛡️  BOTPULSE AI AGENT DETECTION TEST RUNNER (ÉLVARA STOREFRONT)
echo ========================================================================
echo.
echo   [1] Run ALL AI Agents & Bot Tests (Summary Matrix)
echo   [2] Test Google Gemini Autonomous Agent (API Key attribution)
echo   [3] Test Anthropic Claude Web Agent
echo   [4] Test OpenAI GPTBot / ChatGPT Browsing Agent
echo   [5] Test Perplexity AI Autonomous Agent
echo   [6] Test Malicious Scraper / Headless Bot (Verifies BLOCK action)
echo   [7] Test Custom AI Agent (Custom User-Agent & API Key)
echo   [8] Launch Real Playwright Headless Browser Agent on Elvara
echo   [9] Launch VISIBLE (Headed) Chrome Browser Agent on Elvara
echo   [0] Exit
echo.
echo ========================================================================
set /p opt="Enter your choice [0-9]: "

if "%opt%"=="1" (
    cls
    python test_ai_agents.py
    pause
    goto menu
)
if "%opt%"=="2" (
    cls
    python test_ai_agents.py --agent gemini
    pause
    goto menu
)
if "%opt%"=="3" (
    cls
    python test_ai_agents.py --agent claude
    pause
    goto menu
)
if "%opt%"=="4" (
    cls
    python test_ai_agents.py --agent gptbot
    pause
    goto menu
)
if "%opt%"=="5" (
    cls
    python test_ai_agents.py --agent perplexity
    pause
    goto menu
)
if "%opt%"=="6" (
    cls
    python test_ai_agents.py --agent scraper
    pause
    goto menu
)
if "%opt%"=="7" (
    cls
    set /p custom_ua="Enter Custom User-Agent (or press Enter for default): "
    set /p custom_key="Enter API Key (optional): "
    if "%custom_ua%"=="" set custom_ua=MyCustomAgent/1.0
    python test_ai_agents.py --custom-ua "%custom_ua%" --api-key "%custom_key%"
    pause
    goto menu
)
if "%opt%"=="8" (
    cls
    python test_ai_agents.py --browser
    pause
    goto menu
)
if "%opt%"=="9" (
    cls
    python test_ai_agents.py --browser --headed
    pause
    goto menu
)
if "%opt%"=="0" exit /b

goto menu
