# Architecture Overview

## Frontend

- React + Vite SPA with role-based routing.
- Shared UI components and domain-specific pages by role.
- Axios and Socket.io clients for API and real-time updates.

## Backend

- Express API with layered routes, controllers, services, and models.
- JWT-based authentication and role authorization middleware.
- MongoDB/Mongoose for persistence.

## Cross-cutting concerns

- Report exports (PDF/Excel), background jobs, and notification streams.
- Centralized environment configuration for client and server.
