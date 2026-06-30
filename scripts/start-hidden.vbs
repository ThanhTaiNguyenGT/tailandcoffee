Set objShell = CreateObject("WScript.Shell")
objShell.CurrentDirectory = "D:\F2WIN\AI\PROJECT\CLAUDE_CODE_01\tailand-cafe"
objShell.Run "cmd /c """"C:\Program Files\nodejs\node.exe"" app.js >> logs\server.log 2>&1""", 0, False
