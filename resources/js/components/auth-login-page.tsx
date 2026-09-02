import { Form, Head } from '@inertiajs/react';
import { EyeIcon, EyeOffIcon, LockKeyholeIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useId, useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from '@admin-panel/ui/components/reui/alert';
import {
    Frame,
    FrameDescription,
    FramePanel,
    FrameTitle,
} from '@admin-panel/ui/components/reui/frame';
import { Button } from '@admin-panel/ui/components/ui/button';
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@admin-panel/ui/components/ui/field';
import { Input } from '@admin-panel/ui/components/ui/input';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from '@admin-panel/ui/components/ui/input-group';
import { Item, ItemMedia } from '@admin-panel/ui/components/ui/item';
import { cn } from '@admin-panel/ui/lib/utils';
import {
    AdminPanelI18nProvider,
    useAdminPanelI18n,
} from '../i18n/admin-panel-i18n';
import { LanguageSwitcher } from './language-switcher';

type AuthLoginPageProps = {
    action: ComponentProps<typeof Form>['action'];
    description?: string;
    emailPlaceholder?: string;
    footer?: string;
    footerKey?: string;
    icon?: LucideIcon;
    title?: string;
};

type NoiseTextureProps = ComponentProps<'svg'> & {
    frequency?: number;
    noiseOpacity?: number;
    octaves?: number;
    slope?: number;
};

function NoiseTexture({
    className,
    frequency = 0.5,
    noiseOpacity = 0.28,
    octaves = 5,
    slope = 0.08,
    ...props
}: NoiseTextureProps) {
    const filterId = useId();

    return (
        <svg
            aria-hidden="true"
            className={cn(
                'pointer-events-none absolute inset-0 z-0 h-full w-full opacity-50 select-none dark:opacity-[0.75]',
                className,
            )}
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <filter id={filterId}>
                <feTurbulence
                    baseFrequency={frequency}
                    numOctaves={octaves}
                    stitchTiles="stitch"
                    type="fractalNoise"
                />
                <feColorMatrix type="saturate" values="0" />
                <feComponentTransfer>
                    <feFuncR slope={slope} type="linear" />
                    <feFuncG slope={slope} type="linear" />
                    <feFuncB slope={slope} type="linear" />
                </feComponentTransfer>
            </filter>
            <rect
                filter={`url(#${filterId})`}
                height="100%"
                opacity={noiseOpacity}
                width="100%"
            />
        </svg>
    );
}

function ParseLogo() {
    return (
        <svg
            className="size-4"
            fill="none"
            viewBox="25.668 25.1352 49.6644 50"
            xmlns="http://www.w3.org/2000/svg"
        >
            <circle cx="70.634" cy="29.8334" fill="currentColor" r="4.69799" />
            <path
                clipRule="evenodd"
                d="M25.668 57.0144V29.8332C25.668 27.2386 27.7713 25.1352 30.366 25.1352C32.9606 25.1352 35.0639 27.2386 35.0639 29.8332V57.0144C35.0639 61.833 38.9702 65.7392 43.7888 65.7392H57.2116C62.0302 65.7392 65.9364 61.833 65.9364 57.0144V43.7258C65.9364 41.1312 68.0398 39.0278 70.6344 39.0278C73.229 39.0278 75.3324 41.1312 75.3324 43.7258V57.0144C75.3324 67.0222 67.2194 75.1352 57.2116 75.1352H43.7888C33.7809 75.1352 25.668 67.0222 25.668 57.0144Z"
                fill="currentColor"
                fillRule="evenodd"
            />
        </svg>
    );
}

function AuthLogo({ icon: Icon }: { icon?: LucideIcon }) {
    return (
        <Item
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center p-0 text-primary"
            variant="outline"
        >
            <ItemMedia className="size-auto" variant="icon">
                {Icon ? <Icon className="size-4" /> : <ParseLogo />}
            </ItemMedia>
        </Item>
    );
}

function Footer({ children }: { children: ReactNode }) {
    return (
        <footer className="relative z-10 bg-transparent">
            <div className="mx-auto flex max-w-4xl items-center justify-center px-6 py-4 text-center">
                <p className="text-xs text-muted-foreground">{children}</p>
            </div>
        </footer>
    );
}

function AuthLoginPageContent({
    action,
    description,
    emailPlaceholder,
    footer,
    footerKey,
    icon,
    title,
}: AuthLoginPageProps) {
    const { t } = useAdminPanelI18n();
    const [showPassword, setShowPassword] = useState(false);

    return (
        <>
            <Head title={t('auth.sign_in')} />
            <main className="relative min-h-svh w-full min-w-full overflow-hidden bg-background">
                <div className="absolute top-4 right-4 z-20 sm:top-6 sm:right-6">
                    <LanguageSwitcher />
                </div>
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 overflow-hidden"
                >
                    <NoiseTexture className="text-foreground/[0.015] dark:text-foreground/[0.03]" />
                </div>

                <div className="relative z-10 flex min-h-svh w-full min-w-full flex-col">
                    <div className="flex w-full min-w-full flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
                        <div className="mx-auto flex w-full max-w-[28rem] flex-col gap-4">
                            <Frame className="w-full" spacing="lg">
                                <FramePanel className="space-y-8 px-9 py-10 sm:space-y-9 sm:px-11 sm:py-11">
                                    <div className="flex flex-col items-center gap-5 pt-3 text-center">
                                        <AuthLogo icon={icon} />

                                        <div className="flex max-w-xs flex-col gap-1.5">
                                            <FrameTitle className="text-2xl tracking-tight sm:text-[1.75rem]">
                                                {title ??
                                                    t('auth.default_title')}
                                            </FrameTitle>
                                            <FrameDescription className="text-sm text-pretty">
                                                {description ??
                                                    t(
                                                        'auth.default_description',
                                                    )}
                                            </FrameDescription>
                                        </div>
                                    </div>

                                    <Form
                                        action={action}
                                        className="flex flex-col gap-5"
                                        resetOnError={['password']}
                                    >
                                        {({ errors, processing }) => (
                                            <>
                                                {errors.email && (
                                                    <Alert variant="destructive">
                                                        <LockKeyholeIcon aria-hidden="true" />
                                                        <AlertTitle>
                                                            {t(
                                                                'auth.unable_to_sign_in',
                                                            )}
                                                        </AlertTitle>
                                                        <AlertDescription>
                                                            {errors.email}
                                                        </AlertDescription>
                                                    </Alert>
                                                )}

                                                <FieldGroup className="gap-4">
                                                    <Field
                                                        className="gap-2"
                                                        data-invalid={Boolean(
                                                            errors.email,
                                                        )}
                                                    >
                                                        <FieldLabel htmlFor="login-email">
                                                            {t('auth.email')}
                                                        </FieldLabel>
                                                        <Input
                                                            aria-invalid={Boolean(
                                                                errors.email,
                                                            )}
                                                            autoComplete="username"
                                                            autoFocus
                                                            id="login-email"
                                                            name="email"
                                                            placeholder={
                                                                emailPlaceholder ??
                                                                t(
                                                                    'auth.email_placeholder',
                                                                )
                                                            }
                                                            required
                                                            type="email"
                                                        />
                                                    </Field>

                                                    <Field
                                                        className="gap-2"
                                                        data-invalid={Boolean(
                                                            errors.password,
                                                        )}
                                                    >
                                                        <FieldLabel htmlFor="login-password">
                                                            {t('auth.password')}
                                                        </FieldLabel>
                                                        <InputGroup className="w-full">
                                                            <InputGroupInput
                                                                aria-invalid={Boolean(
                                                                    errors.password,
                                                                )}
                                                                autoComplete="current-password"
                                                                id="login-password"
                                                                name="password"
                                                                placeholder={t(
                                                                    'auth.password_placeholder',
                                                                )}
                                                                required
                                                                type={
                                                                    showPassword
                                                                        ? 'text'
                                                                        : 'password'
                                                                }
                                                            />
                                                            <InputGroupAddon align="inline-end">
                                                                <InputGroupButton
                                                                    aria-label={
                                                                        showPassword
                                                                            ? t(
                                                                                  'auth.hide_password',
                                                                              )
                                                                            : t(
                                                                                  'auth.show_password',
                                                                              )
                                                                    }
                                                                    aria-pressed={
                                                                        showPassword
                                                                    }
                                                                    className="text-muted-foreground hover:text-foreground"
                                                                    onClick={() =>
                                                                        setShowPassword(
                                                                            (
                                                                                value,
                                                                            ) =>
                                                                                !value,
                                                                        )
                                                                    }
                                                                    size="icon-xs"
                                                                    type="button"
                                                                >
                                                                    {showPassword ? (
                                                                        <EyeOffIcon
                                                                            aria-hidden="true"
                                                                            className="size-4"
                                                                        />
                                                                    ) : (
                                                                        <EyeIcon
                                                                            aria-hidden="true"
                                                                            className="size-4"
                                                                        />
                                                                    )}
                                                                </InputGroupButton>
                                                            </InputGroupAddon>
                                                        </InputGroup>
                                                        <FieldError>
                                                            {errors.password}
                                                        </FieldError>
                                                    </Field>
                                                </FieldGroup>

                                                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <input
                                                        className="size-4 rounded border-input accent-primary"
                                                        name="remember"
                                                        type="checkbox"
                                                        value="1"
                                                    />
                                                    {t('auth.remember')}
                                                </label>

                                                <Button
                                                    className="w-full"
                                                    disabled={processing}
                                                    type="submit"
                                                >
                                                    {processing
                                                        ? t('auth.signing_in')
                                                        : t('auth.sign_in')}
                                                </Button>
                                            </>
                                        )}
                                    </Form>
                                </FramePanel>
                            </Frame>

                            <p className="text-center text-sm text-muted-foreground">
                                {t('auth.access_help')}
                            </p>
                        </div>
                    </div>

                    <Footer>
                        {footer ??
                            (footerKey ? t(footerKey) : null) ??
                            t('auth.footer')}
                    </Footer>
                </div>
            </main>
        </>
    );
}

export function AuthLoginPage(props: AuthLoginPageProps) {
    return (
        <AdminPanelI18nProvider>
            <AuthLoginPageContent {...props} />
        </AdminPanelI18nProvider>
    );
}
