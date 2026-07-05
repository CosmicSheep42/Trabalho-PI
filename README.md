# Cookwise

Cookwise is a full-stack cooking and home planning application designed to make everyday food organization simpler. It combines recipe discovery, meal planning, shopping lists, calendar events, and lightweight social features in a single experience.

Originally developed as an academic project, the platform is structured and presented as a modern product prototype: practical, user-centered, and focused on real household routines rather than purely technical demonstration.

## Product Overview

Cookwise helps users move from inspiration to execution. A user can discover recipes, save favorites, plan meals for the week, turn recipes into shopping lists, organize events, and collaborate with friends when needed.

The project is built with:

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Backend:** FastAPI, SQLAlchemy, Alembic
- **Database:** MySQL
- **Authentication:** Clerk
- **Infrastructure:** Docker and Docker Compose

## Core Capabilities

- **Recipe discovery:** Browse a curated catalog of recipes with rich details, preparation guidance, servings, and tags.
- **Smart filtering:** Narrow recipes by dietary preferences, cuisine, difficulty, meal type, cooking method, and context such as holidays or occasions.
- **Saved content:** Keep favorite and saved recipes for quick access and a more personalized experience.
- **Shopping lists:** Create lists manually or generate them from recipe ingredients.
- **Meal planning:** Organize meals throughout the week with flexible servings and day-by-day planning.
- **Calendar support:** Create food-related events and connect them with lists and planning tasks.
- **Social organization:** Manage friends, groups, and shared planning flows for collaborative household use.
- **In-app assistant foundation:** The chat layer is prepared to support natural-language actions and guided help inside the product.

## Why This Project Exists

Cookwise was created to explore how a cooking assistant can go beyond recipe browsing and become a broader home planning experience. The project focuses on combining practical features that users naturally expect to work together:

- finding what to cook
- deciding when to cook it
- organizing what to buy
- coordinating with other people

This makes the application a stronger full-stack case study while still feeling grounded in a realistic product direction.

## Running Locally

### Prerequisites

- Docker
- Docker Compose

You can also run the frontend and backend separately outside containers if desired, but Docker is the recommended local setup.

### Environment Variables

Create a `.env` file in the project root and provide the values required for:

- MySQL connection
- backend application settings
- frontend API configuration
- Clerk authentication

Example:

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

Adjust the values to match your local environment.

### Start the Application

From the project root:

```bash
docker compose up --build
```

Default local endpoints:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

## Project Scope

This repository represents a product-oriented academic application. Its purpose is to demonstrate strong end-to-end development across interface design, API architecture, persistence, authentication, and feature integration.

The emphasis is on delivering a cohesive experience rather than building an enterprise production system.

## Roadmap Direction

Potential next steps for the product include:

- deeper natural-language tool execution inside chat
- more advanced collaboration for lists and events
- personalized recipe recommendations
- nutrition-aware planning
- more polished household workflows around recurring meals and shared shopping

## License

This project is licensed under the MIT License.
