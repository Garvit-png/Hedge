# Mini Task Management Dashboard

A full-stack web application that allows users to create, manage, update, and track tasks. Built with React (Vite), Node.js (Express), and Supabase.

## Features

- **Task CRUD**: Create, read, update, and delete tasks.
- **Task Details**: Each task tracks Title, Description, Status (Todo/In Progress/Completed), Due Date, Priority, and Project.
- **Beautiful UI**: High-fidelity modern dashboard design matching professional SaaS layouts.
- **Database**: Relational database persistence using Supabase (PostgreSQL).

## Tech Stack

- **Frontend**: React.js, Vite, TailwindCSS, Lucide Icons, Canvas Confetti
- **Backend**: Node.js, Express, dotenv, CORS
- **Database**: Supabase (PostgreSQL)

## AI Tools Used

This project was built iteratively utilizing the **Google DeepMind Antigravity IDE Agent** using the Gemini model for complete architecture scaffolding, UI design translation, and full-stack integration.

---

## Setup Instructions

### 1. Database Setup (Supabase)

1. Create a free account and project at [Supabase](https://supabase.com/).
2. Open your Supabase project dashboard, go to **SQL Editor**, and run the following script to create the `tasks` table:

```sql
CREATE TABLE tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  status text DEFAULT 'Todo',
  priority text DEFAULT 'Medium',
  due_date date,
  project text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

3. Go to **Project Settings > API** in Supabase.
4. Copy your **Project URL** and **anon public key**.

### 2. Backend Setup

1. Open your terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the `.env.example` file to create a `.env` file:
   ```bash
   cp .env.example .env
   ```
4. Open the new `.env` file and paste in your Supabase URL and Anon Key.
5. Start the backend server:
   ```bash
   node server.js
   ```
   *The server will run on `http://localhost:5001`.*

### 3. Frontend Setup

1. Open a new terminal tab and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *The app will be accessible at `http://localhost:5173`.*

## License

MIT
