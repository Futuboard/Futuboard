## Fast dev environment setup, if using VS Code

1. Install [Restore Terminals](https://marketplace.visualstudio.com/items?itemName=EthanSK.restore-terminals) extension in VS Code.
2. Add following content to .vscode/restore-terminals.json:
3. When opening VS Code, Restore Terminals will automatically open terminals and start all services. You can also run them by opening the context menu (Ctrl + Shift + P) and selecting "Restore Terminals". The "websocket" terminal will crash on the very first run, but can be fixed by just running the last command again after the Python dependencies are installed.

Windows:

```
{
  "keepExistingTerminalsOpen": false,
  "runOnStartup": true,
  "terminals": [
    {
      "splitTerminals": [
        {
          "name": "frontend",
          "commands": ["cd frontend", "npm i", "npm run dev"]
        },
        {
          "name": "backend",
          "commands": [
            "cd backend",
            "python -m venv .venv",
            ".venv/Scripts/activate",
            "pip install -r requirements.txt",
            "python manage.py migrate",
            "python manage.py runserver 0.0.0.0:8000"
          ]
        },
        {
          "name": "websocket",
          "commands": [
            "cd backend",
            ".venv/Scripts/activate",
            "daphne -b 0.0.0.0 -p 5555 backend.asgi:application"
            "shouldRunCommands": false
          ]
        },
        {
          "name": "backend",
          "commands": ["docker compose up database"]
        }
      ]
    }
  ]
}
```

Mac / Linux

```
{
  "keepExistingTerminalsOpen": false,
  "runOnStartup": true,
  "terminals": [
    {
      "splitTerminals": [
        {
          "name": "frontend",
          "commands": ["cd frontend", "npm i", "npm run dev"]
        },
        {
          "name": "backend",
          "commands": [
            "cd backend",
            "python -m venv .venv",
            "source .venv/bin/activate",
            "pip install -r requirements.txt",
            "python manage.py migrate",
            "python manage.py runserver 0.0.0.0:8000"
          ]
        },
        {
          "name": "websocket",
          "commands": [
            "cd backend",
            "source .venv/bin/activate",
            "daphne -b 0.0.0.0 -p 5555 backend.asgi:application"
          ]
        },
        {
          "name": "backend",
          "commands": ["docker compose up database"]
        }
      ]
    }
  ]
}
```
