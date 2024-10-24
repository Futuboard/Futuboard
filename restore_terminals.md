## Fast dev environment setup, if using VS Code'

1. Have Node, Python and Docker installed.
2. Make a virtual environment (.venv) for the backend, and install all pip packages from requirements.txt. The process is described in the README.
3. Install [Restore Terminals](https://marketplace.visualstudio.com/items?itemName=EthanSK.restore-terminals) extension in VS Code.
4. Add following content to .vscode/restore-terminals.json:
5. When opening VS Code, Restore Terminals will automatically open terminals and start all services. You can also run the extension manually by pressing `Ctrl+Shift+P` and typing `Restore Terminals`.
6. Then, if you didn't do it already, you have to run the migrations for the backend. You can do this by running `python manage.py migrate` in the backend terminal.

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
          "commands": ["cd frontend", "npm install", "npm run dev"]
        },
        {
          "name": "backend",
          "commands": [
            ".venv/Scripts/activate",
            "cd backend",
            "python manage.py runserver 0.0.0.0:8000"
          ]
        },
        {
          "name": "websocket",
          "commands": [
            ".venv/Scripts/activate",
            "cd backend",
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
          "commands": ["cd frontend", "npm run dev"]
        },
        {
          "name": "backend",
          "commands": [
            "cd backend",
            "python -m venv .venv",
            "source .venv/bin/activate",
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
