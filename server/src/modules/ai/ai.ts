import { Elysia, t } from 'elysia';
import OpenAI from 'openai';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { findSimilarEntries, formatContext } from './rag';
import { authGuard } from '../../lib/auth';
import { enforceRateLimit } from '../../lib/rate-limit';
import {
    CHAT_MODEL,
    GEMINI_API_BASE,
    GEMINI_OPENAI_BASE,
    IMAGE_MODEL,
    requireGeminiKey,
} from '../../lib/ai-config';

const QUERY = t.String({ minLength: 1, maxLength: 500 });

/** Gemini speaks the OpenAI chat format on this base URL. */
function geminiClient() {
    return new OpenAI({ apiKey: requireGeminiKey(), baseURL: GEMINI_OPENAI_BASE });
}

export const aiRoutes = new Elysia()
    .use(authGuard)

    .post("/search/semantic", async ({ db, user, body }) => {
        await enforceRateLimit(db, user.id, 60, 60);
        try {
            const results = await findSimilarEntries(
                db,
                body.query,
                body.threshold ?? 0.6,
                body.limit ?? 10
            );
            return results;
        } catch (error: any) {
            throw new Error(`Semantic search failed: ${error.message}`);
        }
    }, {
        body: t.Object({
            query: QUERY,
            threshold: t.Optional(t.Number({ minimum: 0, maximum: 1 })),
            limit: t.Optional(t.Number({ minimum: 1, maximum: 50 }))
        })
    })

    .post("/chat", async ({ db, user, body }) => {
        await enforceRateLimit(db, user.id, 20, 60);
        try {
            const relevantEntries = await findSimilarEntries(db, body.query, 0.6, 5);
            const context = formatContext(relevantEntries);

            const provider = createOpenAI({
                apiKey: requireGeminiKey(),
                baseURL: GEMINI_OPENAI_BASE,
            });

            const result = streamText({
                model: provider(CHAT_MODEL),
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant that helps users reflect on their diary entries. Use the provided context to answer questions and provide insights. Be empathetic and supportive.'
                    },
                    {
                        role: 'user',
                        content: `Context from diary entries:\n${context}\n\nQuestion: ${body.query}`
                    }
                ],
                temperature: 0.7,
            });

            return result.toTextStreamResponse();
        } catch (error: any) {
            throw new Error(`Chat failed: ${error.message}`);
        }
    }, {
        body: t.Object({
            query: QUERY
        })
    })

    .post("/ai/summarize", async ({ db, user, body, set }) => {
        await enforceRateLimit(db, user.id, 20, 60);
        if (body.notes.length === 0) {
            set.status = 400;
            return { error: 'notes must not be empty' };
        }

        const allText = body.notes
            .map((n) => `-${n.created_at ?? ''}: ${n.content}`)
            .join("\n");

        const completion = await geminiClient().chat.completions.create({
            messages: [
                { role: "system", content: "คุณเป็นเพื่อนที่อบอุ่น ช่วยอ่านไดอารี่แล้วสรุปความเป็นไปในชีวิตให้หน่อย เป็นภาษาไทยที่อ่านง่าย และตอนท้ายให้ช่วยคิด 'Prompt ภาษาอังกฤษ' สำหรับเอาไปวาดรูป ที่สื่อถึงอารมณ์โดยรวมของไดอารี่ชุดนี้ โดยขึ้นต้นบรรทัด Prompt ว่า 'IMAGE_PROMPT: ...'" },
                { role: "user", content: `This is my Diary:\n${allText}` }
            ],
            model: CHAT_MODEL,
        });
        const choice = completion.choices[0];
        const resultText = choice?.message?.content ?? "";
        return { result: resultText };
    }, {
        body: t.Object({
            notes: t.Array(
                t.Object({
                    created_at: t.Optional(t.String({ maxLength: 40 })),
                    content: t.String({ minLength: 1, maxLength: 20000 })
                }),
                { maxItems: 200 }
            )
        })
    })

    .post("/ai/imagine", async ({ db, user, body, set }) => {
        await enforceRateLimit(db, user.id, 5, 60);
        const res = await fetch(
            `${GEMINI_API_BASE}/models/${IMAGE_MODEL}:generateContent`,
            {
                method: 'POST',
                headers: {
                    'x-goog-api-key': requireGeminiKey(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: body.prompt }] }],
                    generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
                }),
                signal: AbortSignal.timeout(120000),
            }
        );

        if (!res.ok) {
            const detail = (await res.text()).slice(0, 200);
            // 429 means the current plan has no image quota; say so plainly.
            set.status = res.status === 429 ? 503 : 502;
            return {
                error: res.status === 429
                    ? 'Image generation is not available on the current AI plan'
                    : `Image provider failed: ${detail}`,
            };
        }

        const data = (await res.json()) as {
            candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }> } }>;
        };
        const parts = data.candidates?.[0]?.content?.parts ?? [];
        const image = parts.find((p) => p.inlineData?.data)?.inlineData;
        if (!image?.data) {
            set.status = 502;
            return { error: 'Image provider returned no image' };
        }

        return { imageUrl: `data:${image.mimeType ?? 'image/png'};base64,${image.data}` };
    }, {
        body: t.Object({
            prompt: t.String({ minLength: 1, maxLength: 1000 })
        })
    });
