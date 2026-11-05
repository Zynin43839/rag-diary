# RAG Diary Project Overview

## Project Structure

### Frontend (Next.js App Router)
```
frontend/
├── app/
│   ├── (dashboard)/
│   │   ├── diary/page.tsx          # Diary entry form and list
│   │   ├── search/page.tsx         # Semantic search and chat interface
│   │   └── ...                     # Other dashboard pages
│   ├── layout.tsx                  # Root layout with providers
│   └── ...
├── src/
│   ├── components/
│   │   ├── diary/
│   │   │   ├── diaryForm.tsx       # Form for creating diary entries
│   │   │   ├── diaryList.tsx       # List of diary entries
│   │   │   ├── SemanticSearch.tsx  # Semantic search component
│   │   │   └── DiaryChat.tsx       # Chat interface component
│   │   ├── aiGenerator/
│   │   │   └── AIGenerator.tsx     # AI summary and image generation
│   │   └── ...
│   ├── lib/
│   │   ├── api.ts                  # API client with eden treaty
│   │   └── hooks/
│   │       └── useDiary.ts         # Custom hook for diary functionality
│   ├── types/
│   │   └── diary.ts                # TypeScript interfaces
│   └── utils/
│       └── providers.tsx           # React Query provider
└── public/
    └── ...                         # Static assets
```

### Backend (ElysiaJS)
```
server/
├── src/
│   ├── index.ts                    # Main Elysia application
│   ├── lib/
│   │   ├── db.ts                   # Supabase client
│   │   └── schema.sql              # Database schema
│   └── modules/
│       ├── ai/
│       │   └── rag.ts              # RAG functionality
│       └── ...
├── package.json                    # Backend dependencies
└── .env                            # Environment variables
```

## Key Features

### 1. Diary Management
- Create diary entries with automatic embedding generation
- View and manage existing entries
- Tag-based organization

### 2. AI-Powered Features
- Summarize diary entries with AI
- Generate images based on diary content
- Semantic search through diary entries
- Chat with your diary using RAG

### 3. Vector Database Integration
- PostgreSQL with pgvector extension
- Efficient similarity search using HNSW indexes
- Hybrid search combining keyword and semantic search

## Technology Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- TanStack Query (React Query)
- React Server Components

### Backend
- ElysiaJS (Bun runtime)
- TypeScript
- Supabase (PostgreSQL with pgvector)
- OpenAI API
- Vercel AI SDK

### Database Schema
- `diary_entries` table with:
  - UUID primary key
  - Content text field
  - Created timestamp
  - Vector embedding field (1536 dimensions for OpenAI)
- HNSW index for fast similarity search
- RPC functions for semantic search operations

## API Endpoints

### Diary Management
- GET `/notes` - Get all diary entries
- POST `/notes` - Create new diary entry
- DELETE `/notes/:id` - Delete diary entry
- PATCH `/notes/:id` - Update diary entry

### AI Features
- POST `/ai/summarize` - Summarize diary entries
- POST `/ai/imagine` - Generate images from prompts
- POST `/search/semantic` - Semantic search through entries
- POST `/chat` - Chat with diary entries using RAG

## Development Workflow

1. Start Supabase database with pgvector extension
2. Set up environment variables in `.env` files
3. Install dependencies: `bun install` in both frontend and backend
4. Run backend: `bun run dev` in server directory
5. Run frontend: `bun dev` in frontend directory
6. Access application at http://localhost:3000

## Deployment

### Backend
- Deploy ElysiaJS server to any Bun-compatible hosting platform
- Configure environment variables for Supabase and OpenAI

### Frontend
- Deploy Next.js app to Vercel or similar platform
- Configure API endpoint URLs
- Set up environment variables

## Future Enhancements
- User authentication and personalization
- Advanced filtering and sorting options
- Export/import functionality for diary entries
- Mobile-responsive design improvements
- Additional AI models and providers