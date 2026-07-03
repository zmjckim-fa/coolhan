# Bloomly — Plant Care Reminder App

Bloomly helps users track watering schedules for their houseplants.

## Stack
- Backend: Node.js / Express
- Database: MongoDB
- Frontend: Vue 3

## Features
- Plant list (`GET /plants`)
- Add plant (`POST /plants`)
- Watering schedule (`GET /plants/:id/schedule`)
- Reminder notifications (`POST /reminders`)

## Data Models
- **Plant**: id, name, species, wateringIntervalDays, lastWatered
- **Reminder**: id, plantId, dueDate, sent

## Navigation
- Dashboard
- My Plants
- Schedule
- Settings

## Deployment
- `npm run start` on port 3000
