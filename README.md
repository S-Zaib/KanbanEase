# KanbanEase

A modern, real-time Kanban board application built with React, TypeScript, and Supabase.

## Features

- Create and manage task lists
- Add, edit, and delete tasks
- Drag and drop tasks between lists
- Real-time updates using Supabase
- Modern UI with Tailwind CSS

## Tech Stack

- React 18
- TypeScript
- Vite + SWC
- Tailwind CSS
- Supabase (Auth + Database + Real-time)
- @hello-pangea/dnd (Drag and Drop)

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/kanban-ease.git
cd kanban-ease
```

2. Install dependencies:
```bash
npm install
```

3. Create a Supabase project and get your project URL and anon key.

4. Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Run the SQL migration in your Supabase dashboard (from `supabase/migrations/20240317_initial_schema.sql`)

6. Start the development server:
```bash
npm run dev
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
  ├── components/
  │   ├── Board.tsx       # Main board component
  │   ├── List.tsx        # List component
  │   └── Task.tsx        # Task component
  ├── lib/
  │   └── supabase.ts     # Supabase client and types
  └── App.tsx             # Root component
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
