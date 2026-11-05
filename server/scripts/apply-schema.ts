/**
 * Apply server/src/lib/schema.sql to a Supabase Postgres database.
 * Run: bun run apply:schema
 *
 * Needs SUPABASE_DB_URL in server/.env, for example:
 *   postgresql://postgres.<project-ref>:<db-password>@aws-0-<region>.pooler.supabase.com:5432/postgres
 * (Supabase dashboard: Project Settings -> Database -> Connection string -> URI)
 */
import dotenv from 'dotenv';
import postgres from 'postgres';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '..', '.env') });
dotenv.config({ path: join(__dirname, '..', '.env'), override: true });

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
    console.error('Missing SUPABASE_DB_URL in server/.env');
    console.error('Add the URI from Supabase -> Project Settings -> Database.');
    process.exit(1);
}

const schemaPath = join(__dirname, '..', 'src', 'lib', 'schema.sql');
const schema = readFileSync(schemaPath, 'utf8');

/** Split SQL on top-level semicolons, respecting $$ blocks, quotes and comments. */
function splitStatements(sql: string): string[] {
    const out: string[] = [];
    let current = '';
    let inDollar = false;
    let inSingle = false;
    let inDouble = false;
    let inLineComment = false;

    for (let i = 0; i < sql.length; i++) {
        const ch = sql[i];
        const next = sql[i + 1];

        if (inLineComment) {
            current += ch;
            if (ch === '\n') inLineComment = false;
            continue;
        }
        if (!inDollar && !inSingle && !inDouble && ch === '-' && next === '-') {
            inLineComment = true;
            current += ch;
            continue;
        }
        if (!inSingle && !inDouble && ch === '$' && next === '$') {
            inDollar = !inDollar;
            current += '$$';
            i++;
            continue;
        }
        if (!inDollar && ch === "'" && !inDouble) inSingle = !inSingle;
        if (!inDollar && ch === '"' && !inSingle) inDouble = !inDouble;

        if (ch === ';' && !inDollar && !inSingle && !inDouble) {
            const statement = current.trim();
            if (statement) out.push(statement);
            current = '';
            continue;
        }
        current += ch;
    }
    const tail = current.trim();
    if (tail) out.push(tail);
    return out;
}

const statements = splitStatements(schema);
console.log(`Applying ${statements.length} statements from schema.sql`);

const sql = postgres(dbUrl, { prepare: false, max: 1 });
try {
    for (let i = 0; i < statements.length; i++) {
        const preview = statements[i].replace(/\s+/g, ' ').slice(0, 70);
        await sql.unsafe(statements[i]);
        console.log(`  [${i + 1}/${statements.length}] ${preview}`);
    }
    const tables = await sql`
        select table_name from information_schema.tables
        where table_schema = 'public' and table_name = 'diary_entries'`;
    const fns = await sql`
        select routine_name from information_schema.routines
        where routine_schema = 'public'
          and routine_name in ('match_diary_entries', 'search_diary_entries')`;
    console.log('\nApplied.');
    console.log('  table diary_entries:', tables.length ? 'present' : 'MISSING');
    console.log('  search functions:', fns.map((r: any) => r.routine_name).join(', ') || 'MISSING');
} catch (err) {
    console.error('\nFailed:', (err as Error).message);
    process.exitCode = 1;
} finally {
    await sql.end();
}
