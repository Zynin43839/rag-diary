'use client'

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"
import { AuthProvider } from "@/utils/auth-context"
import { ToastProvider } from "@/components/ui/toast"
import { ConfirmProvider } from "@/components/ui/confirm"
import { AiConsentProvider } from "@/components/ui/ai-consent"
import { I18nProvider } from "@/lib/i18n"

export default function Providers({ children }: { children: ReactNode }) {
    //make queryClient with useState to prevent re-build components when re-render
    const [queryClient] = useState(() => new QueryClient())

    return (
        <QueryClientProvider client={queryClient}>
            <I18nProvider>
                <ToastProvider>
                    <ConfirmProvider>
                        <AiConsentProvider>
                            <AuthProvider>
                                {children}
                            </AuthProvider>
                        </AiConsentProvider>
                    </ConfirmProvider>
                </ToastProvider>
            </I18nProvider>
        </QueryClientProvider>
    )
}
