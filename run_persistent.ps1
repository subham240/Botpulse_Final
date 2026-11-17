# Launch BotPulse persistently outside of agent job object using Windows Management Instrumentation (WMI)
$pythonPath = "C:\Users\lenovo\AppData\Local\Programs\Python\Python314\python.exe"
$scriptPath = "C:\Users\lenovo\Downloads\Final_Minor_Project\Botpulse\start_tunnel.py"
$workDir = "C:\Users\lenovo\Downloads\Final_Minor_Project\Botpulse"
$logPath = "C:\Users\lenovo\Downloads\Final_Minor_Project\Botpulse\launcher.log"

$cmdLine = "cmd.exe /c `"`"$pythonPath`" -X utf8 `"$scriptPath`" >> `"$logPath`" 2>&1`""

$res = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
    CommandLine = $cmdLine
    CurrentDirectory = $workDir
}

if ($res.ReturnValue -eq 0) {
    Write-Output "SUCCESS: Launched BotPulse Persistent Supervisor with PID $($res.ProcessId)"
} else {
    Write-Output "FAILED: Could not spawn process (Return code: $($res.ReturnValue))"
}
