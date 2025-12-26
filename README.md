# A/B Testing Platform

A full-stack experimentation platform for running A/B tests with statistical analysis. Built with React, Node.js, TypeScript, and PostgreSQL.

## Features

- Experiment management and configuration
- Hash-based user variant assignment
- Event tracking and conversion monitoring
- Statistical significance testing (Z-test)
- Interactive data visualization with charts
- Real-time results dashboard

## Tech Stack

**Frontend:** React, TypeScript, Recharts, Axios  
**Backend:** Node.js, Express, TypeScript  
**Database:** PostgreSQL  
**Infrastructure:** Docker, Docker Compose

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+

### Installation

1. Setup database:
```bash
createdb ab_testing
# or use Docker: docker-compose up postgres -d
```

2. Backend:
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

3. Frontend:
```bash
cd frontend
npm install
npm start
```

Application runs at http://localhost:3000

## API Endpoints

- `POST /api/experiments` - Create experiment
- `GET /api/experiments` - List experiments
- `PATCH /api/experiments/:id/status` - Update status
- `POST /api/experiments/:id/assign` - Assign user to variant
- `POST /api/events` - Track event
- `GET /api/experiments/:id/results` - Get results with statistics

## Screenshots

[Add screenshots here]

## License

MIT
