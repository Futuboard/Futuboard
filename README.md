# Futuboard

<img src="frontend/public/futuboard-logo.svg" width="100">

- [Introduction](#introduction)
  - [Features](#features)
- [Instructions for local development](#instructions-for-local-development)
  - [Step 1: Environment variables](#step-1-environment-variables)
  - [Step 2: Installing dependencies](#step-2-installing-dependencies)
    - [Frontend dependencies](#frontend-dependencies)
    - [Backend dependencies](#backend-dependencies)
  - [Step 3: Running the project](#step-3-running-the-project)
    - [Option 1: Fully Dockerized development environment](#option-1-fully-dockerized-development-environment)
    - [Option 2: Running frontend, backend and database separately](#option-2-running-frontend-backend-and-database-separately)
      - [Option 2.1: Using the Restore Terminals extension in VS Code](#option-21-using-the-restore-terminals-extension-in-vs-code)
      - [Option 2.2: Running the backend and frontend manually](#option-22-running-the-backend-and-frontend-manually)
  - [Linting and code style](#linting-and-code-style)
    - [Linting in frontend](#linting-in-frontend)
    - [Linting in backend](#linting-in-backend)
  - [Testing](#testing)
    - [Frontend testing](#frontend-testing)
    - [Backend testing](#backend-testing)
    - [E2E testing](#e2e-testing)
- [Technologies](#technologies)
  - [Frontend](#frontend)
    - [React - TypeScript](#react---typescript)
    - [Vite](#vite)
    - [Redux Toolkit - RTK Query](#redux-toolkit---rtk-query)
    - [Style Library: MaterialUI](#style-library-materialui)
    - [React-beautiful-dnd](#react-beautiful-dnd)
    - [ESLint](#eslint)
    - [Prettier](#prettier)
    - [MDXEditor](#mdxeditor)
    - [Recharts](#recharts)
  - [Backend](#backend)
    - [Django](#django)
    - [PyTest](#pytest)
    - [Ruff](#ruff)
  - [Other technologies](#other-technologies)
    - [Cloud Service: Azure](#cloud-service-azure)
    - [Database: PostgreSQL](#database-postgresql)
- [Deployment instructions for deployment to Azure from GitHub](#deployment-instructions-for-deployment-to-azure-from-github)
  - [Database creation and deployment](#database-creation-and-deployment)
  - [Backend deployment](#backend-deployment)
  - [Frontend deployment](#frontend-deployment)
- [Deployment troubleshooting](#deployment-troubleshooting)
  - [Database troubleshooting](#database-troubleshooting)
  - [Backend troubleshooting](#backend-troubleshooting)
  - [Frontend troubleshooting](#frontend-troubleshooting)
## Introduction

[Futuboard](https://futuboard.live/) is a free, easy-to-use and open-source web tool for workflow management that requires no registration. It can be used to manage individual or team work efficiently and remotely. It allows for an easier to use platform than alternative tools with the same features, and it includes automatic visualizations and statistics about the progress of work. Different workflows and frameworks, such as Scrum, Kanban or a simple todo-list, are naturally compatible with Futuboard, and in particular, it enables convenient support for all Scrum events. It produces cumulative flow diagrams and scope burn-ups for process optimization and progress follow-up. Use it on the web or set up your own instance of Futuboard—it's all up to you. To get started, just create a board, save (and share) the link, and start managing your work—it's that simple!

This README includes instructions for setting up a development environment, information about what we've used to create this project, including documentation links, and guides to deploying your own instance either locally or in Azure from GitHub.

### Features

- The user can create a board with a name and optional password
- The user gets a link to the board, which they have to store personally
- The user can create a Column
- The column can be given a name and whether or not it contains swimlane columns
- After creation the name of the column can be changed
- Tickets can be created in a column
- A tickets name, story points, corner notes, description and color can be chosen.
- Tickets in Columns containing swimlanes can be given actions with descriptions
- Tickets can be moved between columns and columns can be moved
- Actions can be moved between swimlane columns
- Actions, tickets and columns can be deleted
- A user can create new users for the board
- A user magnet can be placed on a ticket or action
- Users, tickets and columns can be deleted, deleting actions has not yet been implemented.
- The data of the board can be exported in a JSON file
- A board can be deleted
- A new board can be imported from a previously exported JSON file

## Instructions for local development

The following sections include information about how to start using the tool in a local development environment and about how the project file structure and libraries work.

### Step 1: Environment variables

You will need two `.env` files, one for the frontend (located in the `frontend/` folder) and one for the backend (located in the root folder of the project).
You can look at the `.env.example` files in the frontend and root folders for the required variables.

The simplest development setup is to just make a copy of the two `.env.example` files in the same folders they are already in, and rename them to `.env`.

### Step 2: Installing dependencies

#### Frontend dependencies

First make sure that you have at least v20 of node installed on your computer.

After this the frontend dependencies can be installed by running:

```
cd frontend/
npm install
```

> [!NOTE]
> If you have multiple versions of node installed, run `nvm use 20` before installing the dependencies.

#### Backend dependencies

First make sure python 3.x is installed. Next we recommend creating a virtual environment to avoid installing required packages globally. In the root folder of the project, run

```
python -m venv .venv
```

Activate the created virtual environment using:  
On Windows:

```
.venv/Scripts/activate
```

On Linux/Mac:

```
source .venv/bin/activate
```

After this you can install required packages by running:

```
cd backend/
pip install -r requirements.txt
```

If you will [run the project with Docker](#option-1-fully-dockerized-development-environment), you can close the virtual environment.

### Step 3: Running the project

You can either run the frontend and backend separately or use the fully dockerized development environment.

#### Option 1: Fully Dockerized development environment

You need to install [Docker](https://docs.docker.com/get-started/get-docker/) to your machine. After the installation in the root folder simply run:

```
docker compose up --watch --build
```

The frontend will be available at `localhost:5173` and the backend at `localhost:8000`.

#### Option 2: Running frontend, backend and database separately

You can use the following command to start a local PostgreSQL database using Docker (you need to have Docker installed):

```
docker compose up database
```

The data in the local database is stored in the db/ folder. You can delete the folder, if you want to reset the database.

##### Option 2.1: Using the Restore Terminals extension in VS Code

If you're using VS Code, you can use the [Restore Terminals](https://marketplace.visualstudio.com/items?itemName=EthanSK.restore-terminals) extension to automatically start the backend and frontend servers when you open the folder. .

1. Install the extension
2. Copy and rename the "restore-terminals-windows.json" or "restore-terminals-linux-or-mac.json" to `./vscode/restore-terminals.json` in the root of the project
3. Press `Ctrl+Shift+P` and run the `Restore Terminals` command
4. You might need to restart some of the services, if e.g. the database was not running when the backend tries to connect to it.

##### Option 2.2: Running the backend and frontend manually

You need to run the database migrations, so the local database has the correct tables.  
You can do this by running (in the backend folder, with .venv activated):

```
python manage.py migrate
```

After this the backend server can be run using (in the backend folder, with .venv activated):

```
python manage.py runserver
```

Websocket are needed, if you want the board to update on another users browser when a user makes a change, without needing to refresh the page.  
Websockets can be enabled locally using the command below. You need to run this in a separate terminal window.

```
.venv/Scripts/activate
cd backend/
daphne -p 5555 backend.asgi:application
```

After this the frontend can be run using:

```
cd frontend/
npm run dev
```

### Database migrations

If you make changes to the Django models in `models.py`, you need to create a new migration file, so the changes are propagated to the database. Django can create these migrations automatically with the commands:

```
.venv/Scripts/activate
cd backend/
python manage.py makemigrations
```

If you are using Docker, the migrations should be automatically applied on restart. You can also manually apply them by running:

```

python manage.py migrate

```

### Linting and code style

#### Linting in frontend

The easiest way to lint and format frontend code is to install the [Prettier VS Code extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) and edit your VSCode settings to include

```
{
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

Alternatively, you can use the following commands:  
To check for lint/style errors run:

```
cd frontend/
npm run lint && npm run prettier
```

To automatically fix detected errors run:

```
npm run lint:fix && npm run prettier:fix
```

#### Linting in backend

The easiest way to lint and format backend code is to install [Ruff VS Code extension](https://marketplace.visualstudio.com/items?itemName=charliermarsh.ruff) and edit your VSCode settings to include

```
  "[python]": {
    "editor.defaultFormatter": "charliermarsh.ruff",
    "editor.formatOnSave": true
  },
```

Alternatively, you can use the following commands:  
To check for lint/style errors run:

```
cd backend/
ruff check && ruff format --check
```

To automatically fix detected errors run:

```
ruff check --fix && ruff format
```

### Testing

#### Frontend testing

Currently no unit-tests

#### Backend testing

Pytest unit tests can be run with the commands (locally, inside the virtual environment or docker container):

```
cd backend/
pytest
```

Running one test:

```
pytest PATH_TO_TEST_FILE::TEST_NAME
```

Running all tests in a file:

```
pytest PATH_TO_TEST_FILE
```

#### E2E testing

To run all E2E tests with cypress:

```
cd cypress/
npm install
npm test
```

To open Cypress with an interactive GUI:

```
cd cypress/
npm install
npm start
```

## Technologies

Here are some technologies used in the project and brief justifications:

### Frontend

#### React - TypeScript

React is a popular JavaScript library that offers extensive documentation and flexible interoperability with other libraries.

TypeScript provides type safety and improves the readability and understanding of the program.

[React - Typescript documentation](https://www.typescriptlang.org/docs/handbook/react.html)

#### Vite

Vite provides a fast and efficient development environment and an optimized production process for the frontend.

[Vite Guide](https://vitejs.dev/guide/)

#### Redux Toolkit - RTK Query

Redux is a state management method familiar to many team members, suitable for scalable project state management needs. Because using Redux can be complex, the Redux Toolkit and RTK Query have been adopted to make the use of Redux smoother and more efficient.

[Redux Toolkit Usage Guide](https://redux-toolkit.js.org/usage/usage-guide)

[RTK Query Overview](https://redux-toolkit.js.org/rtk-query/overview)

#### Style Library: MaterialUI

We decided to use a ready-made component library to avoid unnecessary time wastage on styling. MaterialUI allows us to easily give our application a proper appearance.

[MaterialUI documentation](https://mui.com/material-ui/getting-started/)

#### React-beautiful-dnd

React beautiful dnd makes it easy to move elements in lists, which should be well-suited for this project. It provides neat animations and extensive documentation.

[React-beautiful-dnd](https://github.com/atlassian/react-beautiful-dnd)

#### ESLint

ESLint helps developers identify and fix code quality and style issues, ensure compliance with coding standards, and detect errors and bugs in early development stages. It allows teams to define a consistent code style and maintain code quality in their projects.

[ESLint documentation](https://eslint.org/docs/latest/)

#### Prettier

Prettier is a code formatter that helps the development team to stay consistent with the code format.

[Prettier documentation](https://prettier.io/docs/)

#### MDXEditor

MDXEditor is an open-source React component for editing markdown components. Used under the MIT license © Petyo Ivanov.

[MDXEditor GitHub](https://github.com/mdx-editor/editor)

#### Recharts

Recharts is a library that allows us to add different charts to the project.

[Recharts](https://recharts.org/en-US)

### Backend

#### Django

Django offers comprehensive documentation and support, scalability, a fast and dynamic framework for software development, and tools for database management and logic building. More specifically the project uses the django-rest-framework.

[Django documentation](https://docs.djangoproject.com/en/5.0/)

[Rest Framework](https://www.django-rest-framework.org/)

#### PyTest

We decided to use PyTest for backend unit testing due to its simplicity and previous experience using it.

[PyTest documentation](https://docs.pytest.org/en/7.1.x/contents.html)

#### Ruff

Ruff is a code linter and formatter for Python. We selected it because Ruff can do both linting and styling and is pretty straight-forward to use.

[Ruff](https://docs.astral.sh/ruff/)

### Other Technologies

#### Cloud Service: Azure

Azure provides a scalable and secure cloud for project development. It offers the necessary database options and tools for maintaining web applications. The price level also seems to be affordable in Azure, where there are many free features and $100 free credits are offered to students. The documentation also appeared to be clear.

[Azure Documentation](https://learn.microsoft.com/en-us/azure/?product=popular)

#### Database: PostgreSQL

Since we chose Django as our framework, it is natural to select PostgreSQL as our database, as Django provides PostgreSQL-specific tools for communication and numerous data types that operate only in PostgreSQL. Additionally, PostgreSQL offers diverse features that Django supports.

[PostgreSQL documentation](https://www.postgresql.org/docs/)

## Deployment instructions for deployment to Azure from GitHub

These are settings for a development deployment. For a production deployment, additional security settings are needed. It is best to set up the deployment in the following order: database first, then backend and finally the frontend as this may help troubleshooting if any problems occur.

### Database creation and deployment

First, in the marketplace create a new "Azure Database for PostgreSQL Flexible Server". This will open a resource creation view.
In the view, set the "Subscription" and "Resource group" as you prefer. Then name your server and choose the best region for you.

Select PostgreSQL version 16. At time of writing, this should result in PostgreSQL version 16.8 in the final deployment.

For the cheapest hosting, choose Workload type "Development", and click "Configure server". In the new window set "Cluster options" as "server", "Compute tier" as "Burstable", and "Compute size" as "Standard_B1ms". Set "Storage Size" as "32GiB" and "Performance tier" as "P4".

![Azure_PostgreSQL_settings](https://github.com/user-attachments/assets/65efc7fb-3dc1-46e6-8f44-0788c5b12bfc)

For the Authentication method, select "PostgreSQL authentication only". Write a username to "Administrator login" and a password to "Password". These will be used for the backend deployment as the environment variables DB_USER and DB_PASSWORD.
![image](https://github.com/user-attachments/assets/e9d66feb-0835-4321-8027-7993ee56ee16)

On the "Networking" tab, set allow Public access, and allow all IP:s through the firewall by clicking "+ Add 0.0.0.0 - 255.255.255.255". 
![image](https://github.com/user-attachments/assets/1b218c7c-2242-4ddb-a4ac-3d752f7d6c95)

Create the database by clicking "Review + create". The endpoint for the created database can be found by navigating to its overview.

### Backend deployment

Next, to deploy the backend, search for 'web app' in the marketplace. Make sure the description says "Microsoft" and "Azure service". Click "Create" on it to create a new Web App. Set the "Subscription" and "Resource group" as you prefer and then name your application.

Set "Publish style" as "Code" and "Runtime stack" as Python 3.9. Newer Python versions may not work. Set "Region" and "Pricing plan" as you prefer. Then, from the deployment section, set "Continuous deployment" as "Enabled". Next there are some GitHub settings. First you may need to connect your GitHub account. Then, set the "Organization", "Repository" and "Branch" based on your project settings. Most likely the branch is set as "main". After these settings, you may proceed from this view. Leave all other values at their defaults and create the Web App. This will create a new workflow file in the GitHub repository that was set earlier. This file can be found in .github/workflows/ and it will be edited in the next step.

The `build` section needs to be edited in the workflow file. Add `working-directory: ./backend` and `backend` to the `path` field. Your `build` section should look like this:
```
jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python version
        uses: actions/setup-python@v5
        with:
          python-version: '3.9'

      - name: Create and start virtual environment
        working-directory: ./backend
        run: |
          python -m venv venv
          source venv/bin/activate
      
      - name: Install dependencies
        working-directory: ./backend
        run: pip install -r requirements.txt

      - name: Zip artifact for deployment
        working-directory: ./backend
        run: zip release.zip ./* -r

      - name: Upload artifact for deployment jobs
        uses: actions/upload-artifact@v4
        with:
          name: python-app
          path: |
            backend/release.zip
            !backend/venv/

  deploy:
    ...
```

Saving the edited workflow file should trigger a deployment to Azure. Next a few settings must be set in Azure: 

In the API -> CORS section, set "Allowed origins" to all `\*` (for development) or to the frontend's URL (for production).

In the Settings -> Configuration section, find the "Startup Command" text field and paste: 
```
python manage.py migrate && daphne -b 0.0.0.0 -p 8000 backend.asgi:application
```
This will run the migrations on startup, and start the backend with a websocket connection option. 

In the Settings -> Environment Variables section, set all the required env-variables:
```
You can get these DB env-variables from the Settings -> Connect tab of the PostreSQL DB instance in Azure, that you created in previous section. 
DB_HOST= From Azure PostreSQL Connect tab (PGHOST)
DB_USER= From Azure PostreSQL Connect tab (PGUSER)
DB_NAME= From Azure PostreSQL Connect tab (PGDATABASE)
DB_PORT= From Azure PostreSQL Connect tab (PGPORT)
DB_PASSWORD= The password you set for the PostreSQL database when creating it

DB_SCHEMA=public (or something else, if you want to use the same database for multiple environments, but then you need to manually create schema in the DB)

FRONTEND_HOSTNAME= The hostname (i.e. url, but without https://, e.g. futuboard.live) of the frontend, once you have deployed it. 

ADMIN_PASSWORD=some password you can remember (used for editing Board Templates)
JWT_SECRET=some robust secret, e.g. long string of random characters (used for token authentication)
SECRET_KEY=some robust secret, e.g. long string of random characters (used by Django)

SCM_DO_BUILD_DURING_DEPLOYMENT=1 (needed to deploy correctly) 
```

After applying these settings, restart the application from Azure. It may be a good time to wait 15 minutes or so, to make sure that Azure has had enough time updating the deployment.

### Frontend deployment

From the marketplace search for "static web app". Click "Create" on a "Static Web App" that has "Microsoft" and "Azure Service" in the description.

Set the "Subscription" and "Resource group" as you prefer. Name the application and select a "Hosting plan" that serves your purposes. Choose GitHub as the deployment style. Again, you may need to connect your GitHub account. Set the "Organization", "Repository" and "Branch" based on your project settings. Most likely the branch is set as "main". After this, a "Build details" section should become visible. In "Build details", set "Build preset" as "React", set "App Location" as "./frontend" and "Build location" as "dist".

After setting the "Build details", click "review and create". In the review window, click "Create" again, which triggers Azure to create a workflow file in your selected GitHub repository. Again, this new workflow file will need some adjustments. It can be found in .github/workflows

For the frontend to work, environment variables must be added, by editing the workflow file that was just created. After the edit, the workflow file should look like this (except you need to replace the URL with the URL of your backend):
```
name: Azure Static Web Apps CI/CD

on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main

# New env-section for environmental variables
env:
  VITE_DB_ADDRESS: https://your-backend-url.com/api/
  VITE_WEBSOCKET_ADDRESS: wss://your-backend-url.com/board/

jobs:
  ...
```

## Deployment troubleshooting

This section contains troubleshooting tips for these instructions only.

### Database troubleshooting

The database should work as is. Once the backend is successfully deployed, it will modify the database but other than that, the database should be ready once deployed.

### Backend troubleshooting

NOTE: Sometimes the logs provided by Azure may be unreliable and you may need to wait around 15 minutes, and possibly more, to see if the backend has been deployed successfully. It is neccessary to refresh the logs every now and then and it is advisable to copy log streams somewhere safe if looking for something specific, like responses to GET-requests.

The backend is the trickiest part to configure and deploy correctly. Please make sure that all of the environment variables are set correctly in the Azure portal. A good indicator that the backend is at least partially functional is by reaching this view when visiting the backend domain:

<img width="1440" alt="partial-victory" src="https://github.com/user-attachments/assets/c1157b7e-2ef8-4c84-83db-03510b7cf7e8" />

The freshly created database may not contain any information, even after it is modified by the backend. An indicator for a successful connection between the database and the backend can be found by performing a GET-request to an open endpoint in the backend and recieving a most likely empty response "[]" with a "200 OK" response code.

### Frontend troubleshooting

If the backend and the database are set up properly, and the frontend is still not working, check that the frontend environment variables are properly set in the GitHub workflow file. At the time of writing, they can not be activated through the Azure portal and must be properly set in the GitHub workflow file according to the instructions above. A symptom of this problem, is that the frontend is sending requests to itself.

