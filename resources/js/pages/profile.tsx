import { Form, Head, Link, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { AdminPanelLayout } from '@admin-panel/layouts/admin-panel-layout';
import { useAppHttp } from '@admin-panel/hooks/use-app-http';
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@admin-panel/ui/components/ui/avatar';
import { Button } from '@admin-panel/ui/components/ui/button';
import {
    Frame,
    FrameDescription,
    FrameFooter,
    FrameHeader,
    FramePanel,
    FrameTitle,
} from '@admin-panel/ui/components/reui/frame';
import { PageHeader } from '../components/page-header/page-header';
import {
    Field,
    FieldContent,
    FieldGroup,
    FieldLabel,
    FieldSeparator,
} from '@admin-panel/ui/components/ui/field';
import { Input } from '@admin-panel/ui/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@admin-panel/ui/components/ui/sheet';
import { EyeIcon, EyeOffIcon, UploadIcon } from 'lucide-react';
import type { AdminPanelPageProps } from '../types';
import { useAdminPanelI18n } from '../i18n/admin-panel-i18n';
import { PreferencesContent } from './profile/preferences-content';
import { SecurityContent } from './profile/security-content';

export type ProfilePageProps = AdminPanelPageProps & {
    profile: {
        email: string;
        name: string;
    };
    profileUpdateUrl: string;
    passwordUpdateUrl: string;
    avatarUploadUrl: string | null;
    translations: {
        title: string;
        description: string;
        name: string;
        name_description: string;
        email: string;
        email_description: string;
        avatar: string;
        avatar_description: string;
        avatar_upload: string;
        avatar_change: string;
        save: string;
    };
};

export default function Profile() {
    const {
        activeTab = 'profile',
        auth,
        avatarUploadUrl,
        navigation,
        profile,
        profileUpdateUrl,
        passwordUpdateUrl,
        tabUrls,
        translations,
    } = usePage<ProfilePageProps>().props;
    const { t } = useAdminPanelI18n();
    const [avatarPath, setAvatarPath] = useState(auth.user?.avatarPath ?? '');
    const [avatarPreview, setAvatarPreview] = useState<string | null>(
        auth.user?.avatar ?? null,
    );
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const avatarUpload = useAppHttp<
        { file: File | null },
        { path: string; url: string }
    >({ file: null });

    if (!auth.user || !navigation) {
        return null;
    }

    function uploadAvatar(file: File): void {
        if (!avatarUploadUrl) {
            return;
        }

        avatarUpload.transform(() => ({ file }));
        void avatarUpload.post(avatarUploadUrl, {
            onSuccess: (response) => {
                setAvatarPath(response.path);
                setAvatarPreview(response.url);
            },
        });
    }

    return (
        <AdminPanelLayout
            navigation={navigation}
            title={translations.title}
            user={auth.user}
        >
            <Head title={translations.title} />
            <div className="mx-auto w-full">
                <div className="flex flex-col gap-6">
                    <PageHeader
                        title={t('account.label')}
                        tabs={[
                            {
                                value: 'profile',
                                label: t('account.profile'),
                                href: tabUrls?.profile ?? '#',
                            },
                            {
                                value: 'preferences',
                                label: t('account.preferences'),
                                href: tabUrls?.preferences ?? '#',
                            },
                            {
                                value: 'security',
                                label: t('account.security'),
                                href: tabUrls?.security ?? '#',
                            },
                        ]}
                        activeTab={activeTab}
                    />
                    <div className={activeTab === 'profile' ? '' : 'hidden'}>
                        <Frame>
                            <FrameHeader>
                                <FrameTitle>{translations.title}</FrameTitle>
                                <FrameDescription>
                                    {translations.description}
                                </FrameDescription>
                            </FrameHeader>
                            <Form action={profileUpdateUrl} method="put">
                                {({ errors, processing }) => (
                                    <>
                                        <FramePanel className="p-0">
                                            <FieldGroup className="gap-0">
                                                <Field
                                                    orientation="responsive"
                                                    className="px-5 py-4"
                                                >
                                                    <FieldContent>
                                                        <FieldLabel>
                                                            {
                                                                translations.avatar
                                                            }
                                                        </FieldLabel>
                                                    </FieldContent>
                                                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                                                        <Avatar className="size-12 border">
                                                            <AvatarImage
                                                                src={
                                                                    avatarPreview ??
                                                                    undefined
                                                                }
                                                                alt={
                                                                    auth.user
                                                                        .name ??
                                                                    translations.avatar
                                                                }
                                                            />
                                                            <AvatarFallback>
                                                                {(
                                                                    auth.user
                                                                        .name ??
                                                                    'M'
                                                                )
                                                                    .slice(0, 1)
                                                                    .toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        {avatarUploadUrl ? (
                                                            <>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    disabled={
                                                                        avatarUpload.processing
                                                                    }
                                                                    onClick={() =>
                                                                        avatarInputRef.current?.click()
                                                                    }
                                                                >
                                                                    <UploadIcon
                                                                        data-icon="inline-start"
                                                                        aria-hidden="true"
                                                                    />
                                                                    {avatarPath
                                                                        ? translations.avatar_change
                                                                        : translations.avatar_upload}
                                                                </Button>
                                                                <Input
                                                                    ref={
                                                                        avatarInputRef
                                                                    }
                                                                    className="hidden"
                                                                    type="file"
                                                                    accept="image/jpeg,image/png,image/webp"
                                                                    onChange={(
                                                                        event,
                                                                    ) => {
                                                                        const file =
                                                                            event
                                                                                .target
                                                                                .files?.[0];
                                                                        if (
                                                                            file
                                                                        )
                                                                            uploadAvatar(
                                                                                file,
                                                                            );
                                                                        event.currentTarget.value =
                                                                            '';
                                                                    }}
                                                                />
                                                            </>
                                                        ) : null}
                                                        <input
                                                            type="hidden"
                                                            name="avatar"
                                                            value={avatarPath}
                                                        />
                                                    </div>
                                                </Field>
                                                <FieldSeparator />
                                                <Field
                                                    orientation="responsive"
                                                    className="px-5 py-4"
                                                >
                                                    <FieldContent>
                                                        <FieldLabel htmlFor="profile-name">
                                                            {translations.name}
                                                        </FieldLabel>
                                                    </FieldContent>
                                                    <div className="min-w-0 flex-1">
                                                        <Input
                                                            id="profile-name"
                                                            name="name"
                                                            defaultValue={
                                                                profile.name
                                                            }
                                                            autoComplete="name"
                                                            aria-invalid={Boolean(
                                                                errors.name,
                                                            )}
                                                        />
                                                    </div>
                                                </Field>
                                                <FieldSeparator />
                                                <Field
                                                    orientation="responsive"
                                                    className="px-5 py-4"
                                                >
                                                    <FieldContent>
                                                        <FieldLabel htmlFor="profile-email">
                                                            {translations.email}
                                                        </FieldLabel>
                                                    </FieldContent>
                                                    <div className="min-w-0 flex-1">
                                                        <Input
                                                            id="profile-email"
                                                            name="email"
                                                            type="email"
                                                            defaultValue={
                                                                profile.email
                                                            }
                                                            autoComplete="email"
                                                            aria-invalid={Boolean(
                                                                errors.email,
                                                            )}
                                                        />
                                                    </div>
                                                </Field>
                                            </FieldGroup>
                                        </FramePanel>
                                        <FrameFooter className="flex justify-end">
                                            <Button
                                                type="submit"
                                                className="w-fit self-end"
                                                disabled={
                                                    processing ||
                                                    avatarUpload.processing
                                                }
                                            >
                                                {translations.save}
                                            </Button>
                                        </FrameFooter>
                                    </>
                                )}
                            </Form>
                        </Frame>
                    </div>
                    <div
                        className={activeTab === 'preferences' ? '' : 'hidden'}
                    >
                        <PreferencesContent />
                    </div>
                    <div className={activeTab === 'security' ? '' : 'hidden'}>
                        <SecurityContent
                            passwordUpdateUrl={passwordUpdateUrl}
                        />
                    </div>
                </div>
            </div>
        </AdminPanelLayout>
    );
}

function AccountPreferencesContent() {
    return (
        <div className="flex w-full flex-col gap-4">
            <AccountSettingSection
                title="General"
                items={[
                    [
                        'Default view',
                        'Choose which layout opens when you sign in.',
                    ],
                    ['Date format', 'How dates appear across the admin.'],
                    [
                        'First day of week',
                        'Used by calendars and date pickers.',
                    ],
                    ['Auto-save drafts', 'Keep unsaved edits as you work.'],
                    [
                        'Rich text editing',
                        'Show the formatting toolbar in text fields.',
                    ],
                ]}
            />
            <AccountSettingSection
                title="Display"
                items={[
                    [
                        'Color theme',
                        'Applies everywhere, including the sidebar toggle.',
                    ],
                    [
                        'Sidebar position',
                        'Place the navigation on either side.',
                    ],
                    [
                        'Reduce animations',
                        'Minimize motion across the interface.',
                    ],
                    ['Show tooltips', 'Reveal helpful hints on hover.'],
                ]}
            />
        </div>
    );
}

function AccountSecurityContent({
    passwordUpdateUrl,
}: {
    passwordUpdateUrl: string;
}) {
    const [showPasswords, setShowPasswords] = useState(false);
    const [passwordSheetOpen, setPasswordSheetOpen] = useState(false);

    return (
        <div className="flex w-full flex-col gap-4">
            <AccountSettingSection
                title="Sign-in security"
                items={[
                    ['Password', 'Change your account password.'],
                    [
                        'Google Authenticator',
                        'Add an extra layer of protection to your account.',
                    ],
                    [
                        'Active sessions',
                        'Review the devices currently signed in.',
                    ],
                ]}
                actions={{ Password: () => setPasswordSheetOpen(true) }}
            />
            <Sheet open={passwordSheetOpen} onOpenChange={setPasswordSheetOpen}>
                <SheetContent
                    side="right"
                    className="flex flex-col gap-0 overflow-hidden rounded-xl p-0 outline-none data-[side=right]:inset-y-4 data-[side=right]:right-4 data-[side=right]:left-auto data-[side=right]:h-[calc(100svh-2rem)] data-[side=right]:w-[min(64rem,calc(100vw-2rem))] data-[side=right]:max-w-none data-[side=right]:sm:max-w-none"
                >
                    <SheetHeader className="shrink-0 border-b px-5 py-4 pr-16 sm:px-6">
                        <SheetTitle>Change password</SheetTitle>
                        <SheetDescription>
                            Update your password. You will be signed out after
                            saving.
                        </SheetDescription>
                    </SheetHeader>
                    <Form
                        action={passwordUpdateUrl}
                        method="put"
                        className="flex flex-1 flex-col"
                    >
                        {({ errors, processing }) => (
                            <>
                                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
                                    <PasswordInput
                                        name="current_password"
                                        placeholder="Current password"
                                        autoComplete="current-password"
                                        aria-invalid={Boolean(
                                            errors.current_password,
                                        )}
                                        visible={showPasswords}
                                        onToggle={() =>
                                            setShowPasswords((value) => !value)
                                        }
                                    />
                                    {errors.current_password ? (
                                        <p className="text-sm text-destructive">
                                            {errors.current_password}
                                        </p>
                                    ) : null}
                                    <PasswordInput
                                        name="password"
                                        placeholder="New password"
                                        autoComplete="new-password"
                                        aria-invalid={Boolean(errors.password)}
                                        visible={showPasswords}
                                        onToggle={() =>
                                            setShowPasswords((value) => !value)
                                        }
                                    />
                                    {errors.password ? (
                                        <p className="text-sm text-destructive">
                                            {errors.password}
                                        </p>
                                    ) : null}
                                    <PasswordInput
                                        name="password_confirmation"
                                        placeholder="Confirm new password"
                                        autoComplete="new-password"
                                        visible={showPasswords}
                                        onToggle={() =>
                                            setShowPasswords((value) => !value)
                                        }
                                    />
                                </div>
                                <SheetFooter className="flex-row justify-end border-t px-5 py-4 sm:px-6">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            setPasswordSheetOpen(false)
                                        }
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={processing}>
                                        Change password
                                    </Button>
                                </SheetFooter>
                            </>
                        )}
                    </Form>
                </SheetContent>
            </Sheet>
        </div>
    );
}

function PasswordInput({
    name,
    placeholder,
    autoComplete,
    visible,
    onToggle,
    ...props
}: {
    name: string;
    placeholder: string;
    autoComplete: string;
    visible: boolean;
    onToggle: () => void;
    'aria-invalid'?: boolean;
}) {
    return (
        <div className="relative">
            <Input
                {...props}
                name={name}
                type={visible ? 'text' : 'password'}
                placeholder={placeholder}
                autoComplete={autoComplete}
                className="pr-10"
            />
            <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
                aria-label={visible ? 'Hide password' : 'Show password'}
                onClick={onToggle}
            >
                {visible ? <EyeOffIcon /> : <EyeIcon />}
            </Button>
        </div>
    );
}

function AccountSettingSection({
    title,
    items,
    actions = {},
}: {
    title: string;
    items: Array<[string, string]>;
    actions?: Record<string, () => void>;
}) {
    return (
        <Frame spacing="sm">
            <FrameHeader className="px-4 py-3">
                <FrameTitle>{title}</FrameTitle>
            </FrameHeader>
            <FramePanel className="p-0">
                <div className="divide-y">
                    {items.map(([label]) => (
                        <div
                            key={label}
                            className="flex items-center justify-between gap-4 px-4 py-3"
                        >
                            <p className="text-sm font-medium">{label}</p>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-fit shrink-0"
                                onClick={actions[label]}
                            >
                                {actions[label] ? 'Change password' : 'Manage'}
                            </Button>
                        </div>
                    ))}
                </div>
            </FramePanel>
        </Frame>
    );
}
