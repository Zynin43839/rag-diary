import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { noteRoutes } from './modules/notes/note';
import { aiRoutes } from './modules/ai/ai';
import { authRoutes } from './modules/user/auth';
import { errorHandler } from './lib/error';

/**
 * Allowed browser origins. Set FRONTEND_ORIGIN to a comma-separated list in
 * production (for example https://rag-diary-app.vercel.app), otherwise the
 * local dev front end is allowed.
 */
const allowedOrigins = (process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const app = new Elysia()
    .use(cors({
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }))
    .use(errorHandler)
    .use(authRoutes)
    .use(noteRoutes)
    .use(aiRoutes)
    .get("/", () => "Elysia Server is Running! 🦊");

/**
 * Vercel Functions manage the server lifecycle: the app is exported and never
 * listens on a port there. Local development still uses Bun's server.
 */
if (!process.env.VERCEL) {
    app.listen(3001);
    console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
    console.log(`CORS origins: ${allowedOrigins.join(', ')}`);
}

export default app;
export type App = typeof app;
