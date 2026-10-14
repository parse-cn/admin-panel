import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeftIcon, KeyRoundIcon, ShieldCheckIcon } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/components/reui/alert';
import { useState } from 'react';
import { AdminPanelI18nProvider, useAdminPanelI18n } from '../i18n/admin-panel-i18n';
import { Spinner } from '../ui/components/ui/spinner';
import { Button } from '../ui/components/ui/button';
import { TwoFactorCodeInput } from '../components/two-factor-code-input';
import { Frame, FrameTitle, FrameDescription, FramePanel } from '../ui/components/reui/frame';
import { AuthLogo, Footer, NoiseTexture } from '../components/auth-login-page';
import { LanguageSwitcher } from '../components/language-switcher';

export default function TwoFactorChallenge(props: { challengeAction: string; cancelAction: string }) {
  return <AdminPanelI18nProvider><Challenge {...props} /></AdminPanelI18nProvider>;
}

function Challenge({ challengeAction, cancelAction }: { challengeAction: string; cancelAction: string }) {
  const { t } = useAdminPanelI18n();
  const [recovery, setRecovery] = useState(false);
  const form = useForm({ code: '', recovery_code: '' });

  return (
    <>
      <Head title={t('two_factor.challenge_title')} />
      <main className="relative min-h-svh w-full min-w-full overflow-hidden bg-background">
        <div className="absolute top-4 right-4 z-20 sm:top-6 sm:right-6">
          <LanguageSwitcher />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <NoiseTexture className="text-foreground/[0.015] dark:text-foreground/[0.03]" />
        </div>
        <div className="relative z-10 flex min-h-svh w-full min-w-full flex-col">
          <div className="flex w-full min-w-full flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
            <div className="mx-auto flex w-full max-w-[28rem] flex-col gap-4">
              <Frame className="w-full" spacing="lg">
                <FramePanel className="space-y-8 px-9 py-10 sm:space-y-9 sm:px-11 sm:py-11">
                  <div className="flex flex-col items-center gap-5 pt-3 text-center">
                    <AuthLogo icon={recovery ? KeyRoundIcon : ShieldCheckIcon} />
                    <div className="flex max-w-xs flex-col gap-1.5">
                      <FrameTitle className="text-2xl tracking-tight sm:text-[1.75rem]">{t('two_factor.challenge_title')}</FrameTitle>
                      <FrameDescription className="text-sm text-pretty">{t(recovery ? 'two_factor.recovery_help' : 'two_factor.challenge_description')}</FrameDescription>
                    </div>
                  </div>
                  <form className="flex flex-col gap-5" onSubmit={(event) => { event.preventDefault(); form.post(challengeAction); }}>
                    <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="two-factor-code">
                      {t(recovery ? 'two_factor.recovery_code' : 'two_factor.code')}
                      <TwoFactorCodeInput
                        recovery={recovery}
                        key={recovery ? 'recovery' : 'authenticator'}
                        id="two-factor-code"
                        autoFocus
                        aria-invalid={Boolean(form.errors.code || form.errors.recovery_code)}
                        value={recovery ? form.data.recovery_code : form.data.code}
                        onChange={(event) => form.setData(recovery ? 'recovery_code' : 'code', event.target.value)}
                      />
                    </label>
                    <Button type="button" variant="link" size="xs" className="self-center px-0 font-normal text-muted-foreground hover:text-foreground" disabled={form.processing} onClick={() => { form.resetAndClearErrors(); setRecovery(!recovery); }}>
                      {t(recovery ? 'two_factor.back_to_authenticator' : 'two_factor.authenticator_unavailable')}
                    </Button>
                    {(form.errors.code || form.errors.recovery_code) && <Alert variant="destructive"><AlertDescription>{form.errors.code || form.errors.recovery_code}</AlertDescription></Alert>}
                    <Button type="submit" className="w-full" disabled={form.processing} aria-busy={form.processing}>{form.processing && <Spinner aria-hidden="true" />}{t('two_factor.verify')}</Button>
                    <Button type="button" variant="ghost" className="w-full text-muted-foreground" disabled={form.processing} onClick={() => router.delete(cancelAction)}><ArrowLeftIcon className="size-4" aria-hidden="true" />{t('two_factor.back_to_login')}</Button>
                  </form>
                </FramePanel>
              </Frame>
              <p className="text-center text-sm text-muted-foreground">{t('auth.access_help')}</p>
            </div>
          </div>
          <Footer>{t('auth.footer')}</Footer>
        </div>
      </main>
    </>
  );
}
