'use client'

import { useState, useRef, useEffect } from 'react'
import { useDiary } from '@/lib/hooks/useDiary'
import { ChatMessage } from '@/types/diary'
import { useRequireAuth } from '@/utils/auth-context'
import { useAiConsent } from '@/components/ui/ai-consent'
import { friendlyError } from '@/lib/errors'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function DiaryChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { chatWithEntries } = useDiary()
  const ensureAuth = useRequireAuth()
  const ensureConsent = useAiConsent()
  const { t, locale } = useI18n()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ensureAuth()) return
    if (!input.trim() || chatWithEntries.isPending) return
    if (!(await ensureConsent())) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')

    try {
      const response = await chatWithEntries.mutateAsync(input)

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: typeof response === 'string' ? response : t('chat.received'),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: t(friendlyError(err, 'chat.failed')),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    }
  }

  return (
    <div className="pa-sheet flex h-full flex-col">
      <p className="pa-label">{t('chat.label')}</p>
      <h3 className="font-serif text-2xl font-semibold text-pa-ink">{t('chat.title')}</h3>
      <p className="mb-5 mt-1 text-sm text-pa-pencil">{t('chat.subtitle')}</p>

      <div className="flex min-h-96 flex-1 flex-col rounded-md border border-pa-rule">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-pa-kraft p-4">
          {messages.length === 0 ? (
            <div className="py-8 text-center text-pa-pencil">
              <p>{t('chat.start')}</p>
              <p className="mt-2 text-sm">{t('chat.example')}</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-md border px-4 py-2 ${
                    message.role === 'user'
                      ? 'border-pa-inkblue bg-pa-inkblue text-pa-page'
                      : 'border-pa-rule bg-pa-page text-pa-ink'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className="mt-1 text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString(locale === 'th' ? 'th-TH' : 'en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          {chatWithEntries.isPending && (
            <div className="flex justify-start">
              <div className="rounded-md border border-pa-rule bg-pa-page px-4 py-2 text-pa-pencil">
                {t('chat.thinking')}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t border-pa-rule bg-pa-page p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('chat.placeholder')}
              disabled={chatWithEntries.isPending}
            />
            <Button
              type="submit"
              variant="secondary"
              disabled={chatWithEntries.isPending || !input.trim()}
            >
              {t('chat.send')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
