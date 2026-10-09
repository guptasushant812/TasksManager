# Task Manager Pro

A modern, highly responsive, and robust full-stack task management application designed for granular workflow tracking and follow-up communications. 

Built with **Next.js** (Frontend) and **Node.js** (Backend), this system provides professionals with a seamless way to track tasks across specific years, months, weeks, and days without overwhelming the user interface.

## 🚀 Key Features

* **Advanced Cascading Filtering**: Drill down from a macro (Year) to micro (Day) view instantly. The system intelligently auto-filters to the current year and month on startup.
* **Follow-Ups Module**: A dedicated interface for managing tasks that require active follow-up communications, utilizing the exact same filtering architecture as the main tasks view for absolute consistency.
* **Smart Dynamic Grouping**: Tasks are automatically grouped by Week natively in the data tables, allowing users to rapidly scan their workflow.
* **Premium Minimalist UI**: A gorgeous, dark-themed interface built from the ground up prioritizing readability, contrast, and micro-interactions.
* **Public Status Page**: A fully responsive status page for external or high-level viewing, featuring skeleton loaders, client-side search, and horizontal scroll navigation on mobile.

## 🛠️ Problem Statement & Solutions (Recent Improvements)

We recently underwent a massive UI/UX and architectural overhaul to solve several critical pain points:

1. **Problem: Clunky & Misplaced Filters**
   * *Before*: A massive, 3-tier cascading filter took up too much vertical space on the main Dashboard, while the actual Task Module lacked advanced filtering capabilities.
   * *Solution*: Migrated the advanced filter into the Task Module and Follow-Ups Module, condensing it into a sleek, single-card horizontal layout. It now defaults to the current year and month dynamically, showing all relevant data instantly on load.

2. **Problem: Hard-to-Read Data Grouping**
   * *Before*: The Task Table grouped items by raw dates (e.g., "WEEK OF 14-09-2026"), which was wordy and hard to parse.
   * *Solution*: Integrated dynamic week indexing so tasks are neatly grouped under clean headers like **"WEEK 2"**, accompanied by a subtle date range (`14-09-2026 – 20-09-2026`) for maximum clarity.

3. **Problem: Future Year Clutter**
   * *Before*: The year filter generated years far into the future (e.g., 2027), confusing the timeline.
   * *Solution*: Implemented a dynamic bounding system that caps available years strictly to the current year, automatically updating when a new year begins.

4. **Problem: Backend Port Conflicts (EADDRINUSE)**
   * *Before*: The Node backend frequently crashed due to zombie processes locking Port 4000.
   * *Solution*: Identified and terminated orphaned Node.js processes, restoring stable API connectivity between the client and server.

## 💻 Tech Stack

* **Frontend**: Next.js (React), standard CSS modules (custom design system)
* **Backend**: Node.js, Express.js (Port 4000)
* **Icons**: Lucide React

## ⚙️ Getting Started

### 1. Environment Configuration & Security

> 🔒 **Security Notice**: Never commit `.env` files or real database credentials to Git. All secrets must remain in local, uncommitted `.env` files which are protected by `.gitignore`.

1. **Configure Server Environment**:
   Copy the example environment template into `server/.env`:
   ```bash
   cp server/.env.example server/.env
   # Or copy root .env.example
   ```
   Open `server/.env` and configure your MongoDB connection:
   ```env
   # Local MongoDB
   MONGODB_URI=mongodb://localhost:27017/taskmanager

   # Or MongoDB Atlas Cluster
   # MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority

   PORT=4000
   CLIENT_URL=http://localhost:3000
   OPENAI_API_KEY=your_openai_api_key_here
   ```

2. **Configure Client Environment (Optional)**:
   ```bash
   # In client/.env.local (if customized)
   NEXT_PUBLIC_API_URL=http://localhost:4000
   ```

### 2. Running the Application

1. **Start the Backend server**:
   ```bash
   cd server
   npm install
   npm run dev
   ```

2. **Start the Frontend client**:
   ```bash
   cd client
   npm install
   npm run dev
   ```
