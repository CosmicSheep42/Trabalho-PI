# Trabalho PI

The project is a cooking assistant focused on helping users discover recipes, save favorites, organize shopping lists, and plan meals throughout the week.

The goal is not to be a commercial nutrition or inventory management platform, but a practical academic project that demonstrates full-stack development, database modeling, authentication, API design, and user-centered features for everyday cooking.

## Overview

The application allows users to browse a collection of recipes, filter them by different criteria, save recipes, create shopping lists, and organize recipes in a weekly meal planner.

The project follows a client-server architecture:

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Backend:** Python, FastAPI, SQLAlchemy
- **Database:** MySQL
- **Authentication:** Clerk
- **Migrations:** Alembic
- **Containerization:** Docker and Docker Compose

## Main Features

### Recipe Catalog

Users can browse recipes and view detailed information such as:

- Ingredients
- Preparation steps
- Cooking time
- Servings
- Dietary tags
- Cuisine and occasion tags
- User rating and saved/favorite state

### Recipe Filtering

Recipes can be filtered by search terms and categories such as:

- Meal type
- Cuisine
- Dietary restrictions
- Difficulty
- Cooking method
- Main protein
- Weather or occasion
- Holiday association

### Saved and Favorite Recipes

Authenticated users can save recipes for later usage and mark recipes as favorites.  
This allows the application to provide a more personalized cooking experience.

### Shopping Lists

Users can create shopping lists and add items manually.  
Recipes can also be added to a shopping list, automatically including their ingredients.

### Customize servings

If needed, users can edit the amount of portions of a recipe, updating the ingredients in real time.

### Meal Planner

The meal planner allows users to organize recipes throughout the week.  
Each planned meal can store the selected recipe, day, position, and number of servings.

## Project Structure

```text
Trabalho-PI/
├── backend/
│   ├── alembic/              # Database migrations
│   ├── app/
│   │   ├── api/              # API routes and dependencies
│   │   ├── core/             # Configuration and normalization utilities
│   │   ├── db/               # Database session and seed logic
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   └── main.py           # FastAPI application entry point
│   ├── data/                 # Recipe seed data
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── app/                  # Next.js app router pages
│   ├── components/           # Reusable UI components
│   ├── features/             # Feature-specific UI modules
│   ├── hooks/                # Frontend state and API logic
│   ├── lib/                  # API client and utilities
│   ├── styles/               # Global styles and theme files
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
├── README.md
└── LICENSE
```

## Running the Project

### Requirements

Before running the project, make sure you have:

- Docker
- Docker Compose
- Node.js, if running the frontend outside Docker
- Python, if running the backend outside Docker

### Environment Variables

The project expects environment variables for the database, backend, frontend, and Clerk authentication.

Create a `.env` file in the project root with the required variables, following the structure used by the application.

Example variables may include:

```env
MYSQL_ROOT_PASSWORD=
MYSQL_DATABASE=
MYSQL_USER=
MYSQL_PASSWORD=

DATABASE_URL=

NEXT_PUBLIC_API_URL=

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
```

The exact values depend on the local development environment and Clerk configuration.

### Running with Docker Compose

From the project root, run:

```bash
docker compose up --build
```

This starts:

- MySQL database
- FastAPI backend
- Next.js frontend

The application should be available at:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:8000
```

## Academic Scope

This project was developed as an academic full-stack application.  
Some data, such as recipe content and classifications, is intended for demonstration purposes.

The focus of the project is to demonstrate:

- Full-stack application architecture
- REST API development
- Relational database modeling
- Authentication integration
- Frontend state management
- User-centered feature design
- Containerized development environment

## Possible Future Improvements

Future versions of the project could include:

- Automatic weekly shopping list generation from the meal planner
- Estimated nutritional information for recipes
- Recipe recommendations based on user preferences
- Cooking mode with step-by-step instructions and timers
- Ingredient substitutions

## License

This project is licensed under the MIT License.
