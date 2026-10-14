import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { ShieldCheckIcon, ShieldIcon, KeyRoundIcon, TriangleAlertIcon, CopyIcon, CheckIcon } from 'lucide-react';
import { Alert, AlertDescription } from '../../ui/components/reui/alert';
import { QRCodeSVG } from 'qrcode.react';
import { useAppHttp } from '../../hooks/use-app-http';
import { useAdminPanelI18n } from '../../i18n/admin-panel-i18n';
import { Spinner } from '../../ui/components/ui/spinner';
import { Button } from '../../ui/components/ui/button';
import { TwoFactorCodeInput } from '../../components/two-factor-code-input';
import { Input } from '../../ui/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '../../ui/components/ui/sheet';

export type TwoFactorSettingsProps = {
  enabled: boolean;
  required: boolean;
  recoveryCodesRemaining: number;
  startUrl: string;
  confirmUrl: string;
  cancelUrl: string;
  regenerateUrl: string;
  destroyUrl: string;
  logoutUrl: string;
};

type Binding = { secret: string; url: string; expiresAt: number };
type Result = Partial<Binding> & { recoveryCodes?: string[]; redirectUrl?: string };

export function TwoFactorSettings({ settings }: { settings: TwoFactorSettingsProps }) {
  const { t } = useAdminPanelI18n();
  const [open, setOpen] = useState(settings.required && !settings.enabled);
  const [enabled, setEnabled] = useState(settings.enabled);
  const [remaining, setRemaining] = useState(settings.recoveryCodesRemaining);

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium">{t('account.google_authenticator')}</p>
          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${enabled ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
            {enabled && <ShieldCheckIcon className="size-3" aria-hidden="true" />}
            {t(enabled ? 'two_factor.enabled' : 'two_factor.disabled')}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{t(enabled ? 'two_factor.remaining' : 'two_factor.description', { count: remaining })}</p>
      </div>
      <Button type="button" variant="outline" className="shrink-0" onClick={() => setOpen(true)}>{t(enabled ? 'two_factor.manage' : 'two_factor.enable')}</Button>
      {open && <TwoFactorOverlay settings={{ ...settings, enabled }} close={() => setOpen(false)} saved={(count) => { setEnabled(true); setRemaining(count); }} />}
    </div>
  );
}

function TwoFactorOverlay({ settings, close, saved }: { settings: TwoFactorSettingsProps; close: () => void; saved: (count: number) => void }) {
  const { t } = useAdminPanelI18n();
  const [forcedSetup] = useState(settings.required && !settings.enabled);
  const Root = forcedSetup ? Dialog : Sheet;
  const Content = forcedSetup ? DialogContent : SheetContent;
  const Header = forcedSetup ? DialogHeader : SheetHeader;
  const Title = forcedSetup ? DialogTitle : SheetTitle;
  const Description = forcedSetup ? DialogDescription : SheetDescription;
  const Footer = forcedSetup ? DialogFooter : SheetFooter;
  const footerClassName = 'm-0 shrink-0 flex-row justify-end gap-2 border-t bg-transparent px-5 py-4 sm:px-6';
  const [mode, setMode] = useState<'start' | 'confirm' | 'regenerate' | 'disable'>(settings.enabled ? 'regenerate' : 'start');
  const [binding, setBinding] = useState<Binding | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [recovery, setRecovery] = useState(false);
  const [expired, setExpired] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const request = useAppHttp<{ current_password: string; code: string; recovery_code: string }, Result>({ current_password: '', code: '', recovery_code: '' });
  const cancellation = useAppHttp<Record<string, never>, unknown>({});

  const busy = request.processing || loggingOut;

  function logout() {
    if (busy) return;
    router.delete(settings.logoutUrl, {
      onStart: () => setLoggingOut(true),
      onFinish: () => setLoggingOut(false),
    });
  }

  useEffect(() => {
    if (!binding) return;
    const timer = window.setTimeout(() => {
      setBinding(null);
      setMode('start');
      setExpired(true);
      request.resetAndClearErrors();
    }, Math.max(0, binding.expiresAt * 1000 - Date.now()));
    return () => window.clearTimeout(timer);
    // The timer follows the binding's expiry rather than form edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [binding]);

  function dismiss() {
    if (busy || (forcedSetup && !codes)) return;
    if (binding) void cancellation.delete(settings.cancelUrl).catch(() => {});
    setBinding(null);
    setCodes(null);
    request.resetAndClearErrors();
    close();
  }

  async function copyCodes() {
    if (!codes) return;
    try {
      await navigator.clipboard.writeText(codes.join('\n'));
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
  }

  function submit() {
    if (busy) return;
    const url = mode === 'start' ? settings.startUrl : mode === 'confirm' ? settings.confirmUrl : mode === 'disable' ? settings.destroyUrl : settings.regenerateUrl;
    const options = {
      onSuccess: (result: Result) => {
        request.resetAndClearErrors();
        if (mode === 'start' && result.secret && result.url && result.expiresAt) {
          setBinding({ secret: result.secret, url: result.url, expiresAt: result.expiresAt });
          setExpired(false);
          setMode('confirm');
        } else if (result.recoveryCodes) {
          setBinding(null);
          setCodes(result.recoveryCodes);
          setCopyStatus('idle');
          saved(result.recoveryCodes.length);
        } else if (result.redirectUrl) {
          window.location.assign(result.redirectUrl);
        }
      },
    };
    const promise = mode === 'disable' ? request.delete(url, options) : request.post(url, options);
    void promise.catch(() => {});
  }

  return (
    <Root open onOpenChange={(value) => { if (!value) dismiss(); }}>
      <Content
        {...(forcedSetup ? { showCloseButton: false } : { side: 'right' as const })}
        className={forcedSetup
          ? 'flex max-h-[calc(100svh-2rem)] flex-col gap-0 overflow-hidden rounded-xl p-0 sm:max-w-lg'
          : 'flex flex-col gap-0 overflow-hidden rounded-xl p-0 data-[side=right]:inset-y-4 data-[side=right]:right-4 data-[side=right]:left-auto data-[side=right]:h-[calc(100svh-2rem)] data-[side=right]:w-[min(28rem,calc(100vw-2rem))] data-[side=right]:max-w-none data-[side=right]:sm:max-w-md'}
      >
        <Header className="shrink-0 border-b px-5 py-4 pr-16 sm:px-6">
          <Title>{t(codes ? 'two_factor.recovery_title' : 'account.google_authenticator')}</Title>
          <Description>{t(codes ? 'two_factor.save_codes' : 'two_factor.description')}</Description>
        </Header>
        <div className="flex min-h-0 flex-1 flex-col">
          {codes ? <>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex size-12 items-center justify-center rounded-xl border bg-muted/50 text-primary"><KeyRoundIcon className="size-6" aria-hidden="true" /></div>
                <Button type="button" variant="outline" size="sm" onClick={() => { void copyCodes(); }}>
                  {copyStatus === 'copied' ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
                  <span aria-live="polite">{t(copyStatus === 'copied' ? 'two_factor.copied' : 'two_factor.copy_codes')}</span>
                </Button>
              </div>
              {copyStatus === 'failed' && <p role="alert" className="text-sm text-destructive">{t('two_factor.copy_failed')}</p>}
              <ul className="grid grid-cols-1 gap-2 font-mono text-sm min-[400px]:grid-cols-2">{codes.map((code) => <li key={code} className="rounded-lg border bg-muted/40 px-3 py-3 text-center select-all">{code}</li>)}</ul>
            </div>
            <Footer className={footerClassName}><Button type="button" className="w-full" onClick={dismiss}>{t('two_factor.saved_codes')}</Button></Footer>
          </> : <form className="flex min-h-0 flex-1 flex-col" onSubmit={(event) => { event.preventDefault(); submit(); }}>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
            {settings.required && !settings.enabled && <Alert variant="warning"><ShieldIcon aria-hidden="true" /><AlertDescription>{t('two_factor.setup_required')}</AlertDescription></Alert>}
            {!settings.enabled && <ol aria-label={t('two_factor.enable')} className="flex items-center gap-2 text-xs font-medium">
              {[t('account.current_password'), t('two_factor.confirm'), t('two_factor.recovery_title')].map((label, index) => <li key={label} className={`flex flex-1 items-center gap-2 ${index === (binding ? 1 : 0) ? 'text-primary' : 'text-muted-foreground'}`}><span className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${index === (binding ? 1 : 0) ? 'border-primary bg-primary/10' : 'bg-muted'}`}>{index + 1}</span>{label}</li>)}
            </ol>}
            {expired && <Alert variant="destructive"><TriangleAlertIcon /><AlertDescription>{t('two_factor.setup_expired')}</AlertDescription></Alert>}
            {settings.enabled && <div className="grid grid-cols-1 gap-2 rounded-lg bg-muted/50 p-1 min-[400px]:grid-cols-2">
              <Button type="button" variant={mode === 'regenerate' ? 'outline' : 'ghost'} disabled={busy} onClick={() => { setMode('regenerate'); request.resetAndClearErrors(); }}>{t('two_factor.regenerate')}</Button>
              {!settings.required && <Button type="button" variant={mode === 'disable' ? 'outline' : 'ghost'} disabled={busy} onClick={() => { setMode('disable'); request.resetAndClearErrors(); }}>{t('two_factor.disable')}</Button>}
            </div>}
            {mode === 'start' && <div className="rounded-xl border bg-muted/30 p-4"><ShieldIcon className="mb-3 size-6 text-primary" aria-hidden="true" /><p className="text-sm leading-relaxed text-muted-foreground">{t('two_factor.description')}</p></div>}
            {binding && <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
              <p className="text-sm">{t('two_factor.scan')}</p>
              <div className="mx-auto w-fit max-w-full rounded-xl border bg-white p-2 shadow-xs"><QRCodeSVG value={binding.url} size={200} marginSize={4} title={t('two_factor.scan')} className="h-auto max-w-full" /></div>
              <p className="text-sm text-muted-foreground">{t('two_factor.manual_secret')}</p>
              <code className="block break-all rounded-md border bg-background p-3 text-center font-mono text-sm tracking-wider select-all">{binding.secret}</code>
            </div>}
            {mode !== 'confirm' && <label className="flex flex-col gap-2 text-sm font-medium">
              {t('account.current_password')}
              <Input type="password" autoComplete="current-password" required value={request.data.current_password} onChange={(event) => request.setData('current_password', event.target.value)} />
            </label>}
            {mode !== 'start' && <>
              <label className="flex flex-col gap-2 text-sm font-medium">
                {t(recovery ? 'two_factor.recovery_code' : 'two_factor.code')}
                <TwoFactorCodeInput recovery={recovery} aria-invalid={Boolean(request.errors.code || request.errors.recovery_code)} value={recovery ? request.data.recovery_code : request.data.code} onChange={(event) => request.setData(recovery ? 'recovery_code' : 'code', event.target.value)} />
              </label>
              {settings.enabled && <Button type="button" variant="link" size="xs" className="px-0 font-normal text-muted-foreground hover:text-foreground" disabled={busy} onClick={() => { request.setData({ ...request.data, code: '', recovery_code: '' }); request.clearErrors(); setRecovery(!recovery); }}>{t(recovery ? 'two_factor.use_authenticator' : 'two_factor.use_recovery')}</Button>}
            </>}
            {Object.values(request.errors).map((error, index) => <p key={index} role="alert" className="text-sm text-destructive">{error}</p>)}
            {mode === 'disable' && <Alert variant="warning"><TriangleAlertIcon /><AlertDescription>{t('two_factor.disable_description')}</AlertDescription></Alert>}
            </div>
            <Footer className={footerClassName}>
              {forcedSetup
                ? <Button type="button" variant="outline" disabled={busy} aria-busy={loggingOut} onClick={logout}>{loggingOut && <Spinner aria-hidden="true" />}{t('account.sign_out')}</Button>
                : <Button type="button" variant="outline" disabled={busy} onClick={dismiss}>{t('common.cancel')}</Button>}
              <Button type="submit" variant={mode === 'disable' ? 'destructive' : 'default'} disabled={busy} aria-busy={request.processing}>{request.processing && <Spinner aria-hidden="true" />}{t(mode === 'start' ? 'two_factor.enable' : mode === 'confirm' ? 'two_factor.confirm' : mode === 'disable' ? 'two_factor.disable' : 'two_factor.regenerate')}</Button>
            </Footer>
          </form>}
        </div>
      </Content>
    </Root>
  );
}
