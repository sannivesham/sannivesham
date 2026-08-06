# Vidyalaya

A personal study management platform — upload your study materials, read them
in-browser, plan timetables, manage tasks, and track your progress. All in
one place, all stored locally in your browser (IndexedDB), no backend
required to get started.

## Features

- **Study Library** — organize materials by category, subject, semester, tags
- **Document Reader** — in-browser viewer with bookmarks, notes, highlights
- **Timetable Maker** — recurring study schedules, daily/weekly/monthly views
- **Calendar** — tasks, exams, deadlines in one view
- **To-Do List** — priorities, categories, due dates
- **Pomodoro Timer** — focus sessions with stats
- **Analytics** — study hours, streaks, completion graphs
- **Achievements** — badges for milestones
- **Themes** — light, dark, and accent color options

## Tech stack

- React + Vite
- Tailwind CSS
- IndexedDB (via `idb`) for file/notes storage
- react-router-dom for navigation
- recharts for analytics graphs

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Build

```bash
npm run build
```

Output goes to `dist/`.

## Deploy

This repo is set up to auto-deploy to GitHub Pages via GitHub Actions on
every push to `main`. See `.github/workflows/deploy.yml`.

## License

MIT
