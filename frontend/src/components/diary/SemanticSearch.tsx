'use client'

import { useState } from 'react'
import { useDiary } from '@/lib/hooks/useDiary'
import { SearchResult } from '@/types/diary'
import { useRequireAuth } from '@/utils/auth-context'
import { useAiConsent } from '@/components/ui/ai-consent'
import { friendlyError } from '@/lib/errors'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function SemanticSearch() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const { semanticSearch } = useDiary()
  const ensureAuth = useRequireAuth()
  const ensureConsent = useAiConsent()
  const { t, locale } = useI18n()
  const dateLocale = locale === 'th' ? 'th-TH' : 'en-GB'

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ensureAuth()) return
    if (!(await ensureConsent())) return
    if (query.trim()) {
      semanticSearch.mutate({ query: query.trim() })
    }
  }

  return (
    <div className="pa-sheet flex h-full flex-col">
      <p className="pa-label">{t('search.label')}</p>
      <h3 className="font-serif text-2xl font-semibold text-pa-ink">{t('search.title')}</h3>
      <p className="mb-5 mt-1 text-sm text-pa-pencil">{t('search.subtitle')}</p>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            disabled={semanticSearch.isPending}
          />
          <Button type="submit" variant="secondary" disabled={semanticSearch.isPending || !query.trim()}>
            {semanticSearch.isPending ? t('common.searching') : t('common.search')}
          </Button>
        </div>
      </form>

      {semanticSearch.isSuccess && semanticSearch.data && (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          {semanticSearch.data.length > 0 ? (
            <>
              <h4 className="text-sm font-bold tracking-wide text-pa-ink">
                {t('search.found', { count: semanticSearch.data.length })}
              </h4>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                {semanticSearch.data.map((result: SearchResult) => (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => setSelected(result)}
                    className="w-full rounded-md border border-pa-rule bg-pa-page p-4 text-left transition-colors hover:bg-pa-highlighter focus:outline-none focus-visible:ring-2 focus-visible:ring-pa-inkblue"
                  >
                    <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                      <span className="font-mono text-xs text-pa-pencil">
                        {new Date(result.created_at).toLocaleDateString(dateLocale)}
                      </span>
                      <span className="rounded border border-pa-ink bg-pa-sticky px-2 py-0.5 text-xs font-bold text-pa-ink">
                        {t('search.similar', {
                          percent: ((result.similarity ?? 0) * 100).toFixed(1),
                        })}
                      </span>
                    </div>
                    <p className="line-clamp-3 whitespace-pre-wrap text-pa-ink">{result.content}</p>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-md border border-pa-rule bg-pa-page p-4 text-sm text-pa-ink">
              <p className="font-semibold">{t('search.emptyTitle')}</p>
              <p className="mt-1 text-pa-pencil">
                {t('search.emptyHint')} {t('search.emptyHint2')}
              </p>
            </div>
          )}
        </div>
      )}

      {semanticSearch.isError && (
        <div
          role="alert"
          className="border border-pa-clay bg-pa-page p-3 text-center text-pa-clay"
        >
          {t(friendlyError(semanticSearch.error, 'search.failed'))}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-pa-ink/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="search-note-title"
        >
          <div className="pa-sheet flex max-h-[80vh] w-full max-w-lg flex-col">
            <div className="mb-2 flex items-start justify-between gap-3">
              <h2 id="search-note-title" className="font-serif text-xl font-semibold text-pa-ink">
                {t('search.fullEntry')}
              </h2>
              <button
                type="button"
                className="text-sm font-bold text-pa-inkblue underline"
                onClick={() => setSelected(null)}
              >
                {t('common.close')}
              </button>
            </div>
            <p className="mb-3 font-mono text-xs text-pa-pencil">
              {new Date(selected.created_at).toLocaleString(dateLocale)}
              {selected.tag ? ` · #${selected.tag}` : ''}
            </p>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <p className="whitespace-pre-wrap text-pa-ink">{selected.content}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
