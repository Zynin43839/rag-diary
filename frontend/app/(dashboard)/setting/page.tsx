'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/utils/auth-context'
import { DIARY_ENTRIES_QUERY_KEY } from '@/lib/hooks/useDiary'
import { api } from '@/lib/api'
import { hasAiConsent, revokeAiConsent } from '@/lib/consent'
import { friendlyError } from '@/lib/errors'
import { useT } from '@/lib/i18n'
import { LocaleToggle } from '@/components/layout/locale-toggle'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { useConfirm } from '@/components/ui/confirm'

export default function SettingPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const t = useT()
  const [busy, setBusy] = useState(false)
  const [aiConsent, setAiConsent] = useState(() => hasAiConsent())

  function handleLogout() {
    logout()
    router.replace('/login')
  }

  async function handleExport() {
    if (!user) {
      router.push('/login')
      return
    }
    setBusy(true)
    try {
      const { data, error } = await api.export.get()
      if (error) throw new Error(String(error.value))
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rag-diary-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      toast.error(t(friendlyError(e, 'setting.exportFailed')))
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteAll() {
    if (!user) {
      router.push('/login')
      return
    }
    const ok = await confirm({
      title: t('setting.deleteAllTitle'),
      message: t('setting.deleteAllMessage'),
      confirmLabel: t('setting.deleteAllConfirm'),
      cancelLabel: t('common.cancel'),
      danger: true,
    })
    if (!ok) return
    setBusy(true)
    try {
      const { data, error } = await api.data.delete()
      if (error) throw new Error(String(error.value))
      queryClient.invalidateQueries({ queryKey: DIARY_ENTRIES_QUERY_KEY })
      toast.success(t('setting.deletedCount', { count: data?.deleted ?? 0 }))
    } catch (e) {
      toast.error(t(friendlyError(e, 'setting.deleteFailed')))
    } finally {
      setBusy(false)
    }
  }

  function handleRevokeConsent() {
    revokeAiConsent()
    setAiConsent(false)
    toast.success(t('setting.revoked'))
  }

  return (
    <>
      <section className="pa-sheet mb-6">
        <h2 className="mb-4 font-serif text-xl font-semibold text-pa-ink">{t('setting.account')}</h2>
        <div className="mb-4 rounded-md border border-pa-rule bg-pa-kraft p-4">
          <p className="pa-label">{t('setting.signedInWith')}</p>
          <p className="break-all font-semibold text-pa-ink">
            {user?.email ?? t('setting.notSignedIn')}
          </p>
        </div>
        <div className="mb-4 flex items-center gap-3">
          <span className="pa-label mb-0">{t('common.language')}</span>
          <LocaleToggle />
        </div>
        {user ? (
          <Button variant="outline" onClick={handleLogout}>
            {t('common.logout')}
          </Button>
        ) : (
          <Button onClick={() => router.push('/login')}>{t('common.login')}</Button>
        )}
      </section>

      <section className="pa-sheet mb-6">
        <h2 className="mb-4 font-serif text-xl font-semibold text-pa-ink">{t('setting.data')}</h2>
        <p className="mb-4 text-sm text-pa-pencil">{t('setting.exportDesc')}</p>
        <Button variant="secondary" onClick={handleExport} disabled={busy || !user}>
          {t('setting.export')}
        </Button>
      </section>

      <section className="pa-sheet mb-6">
        <h2 className="mb-2 font-serif text-xl font-semibold text-pa-ink">
          {t('setting.consentTitle')}
        </h2>
        <p className="mb-4 text-sm text-pa-pencil">{t('setting.consentDesc')}</p>
        <p className="mb-4 text-sm font-semibold text-pa-ink">
          {t('setting.consentStatus', {
            status: aiConsent ? t('setting.consented') : t('setting.notConsented'),
          })}
        </p>
        {aiConsent ? (
          <Button variant="outline" onClick={handleRevokeConsent}>
            {t('setting.revoke')}
          </Button>
        ) : (
          <p className="text-sm text-pa-pencil">{t('setting.consentHint')}</p>
        )}
      </section>

      <section className="pa-sheet border border-pa-clay">
        <h2 className="mb-2 font-serif text-xl font-semibold text-pa-clay">
          {t('setting.danger')}
        </h2>
        <p className="mb-4 text-sm text-pa-pencil">{t('setting.dangerDesc')}</p>
        <Button variant="destructive" onClick={handleDeleteAll} disabled={busy || !user}>
          {t('setting.deleteAll')}
        </Button>
      </section>
    </>
  )
}
