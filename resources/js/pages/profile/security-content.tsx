import { Form } from '@inertiajs/react';
import { useState } from 'react';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { Button } from '@admin-panel/ui/components/ui/button';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from '@admin-panel/ui/components/ui/input-group';
import {
    Frame,
    FrameDescription,
    FrameFooter,
    FrameHeader,
    FramePanel,
    FrameTitle,
} from '@admin-panel/ui/components/reui/frame';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@admin-panel/ui/components/ui/sheet';
import { useAdminPanelI18n } from '../../i18n/admin-panel-i18n';

export function SecurityContent({
    passwordUpdateUrl,
}: {
    passwordUpdateUrl: string;
}) {
    const [open, setOpen] = useState(false);
    const { t } = useAdminPanelI18n();
    return (
        <div className="flex w-full flex-col gap-4">
            <Frame spacing="sm">
                <FrameHeader className="px-4 py-3">
                    <FrameTitle>{t('account.security_title')}</FrameTitle>
                    <FrameDescription>
                        {t('account.security_description')}
                    </FrameDescription>
                </FrameHeader>
                <FramePanel className="p-0">
                    <div className="divide-y">
                        <SecurityRow
                            label={t('account.password')}
                            onClick={() => setOpen(true)}
                        />
                        <SecurityRow
                            label={t('account.google_authenticator')}
                        />
                        <SecurityRow label={t('account.active_sessions')} />
                    </div>
                </FramePanel>
            </Frame>
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent
                    side="right"
                    className="flex flex-col gap-0 overflow-hidden rounded-xl p-0 outline-none data-[side=right]:inset-y-4 data-[side=right]:right-4 data-[side=right]:left-auto data-[side=right]:h-[calc(100svh-2rem)] data-[side=right]:w-[min(28rem,calc(100vw-2rem))] data-[side=right]:max-w-none data-[side=right]:sm:max-w-md"
                >
                    <SheetHeader className="shrink-0 border-b px-5 py-4 pr-16 sm:px-6">
                        <SheetTitle>
                            {t('account.change_password_title')}
                        </SheetTitle>
                        <SheetDescription>
                            {t('account.change_password_description')}
                        </SheetDescription>
                    </SheetHeader>
                    <Form
                        action={passwordUpdateUrl}
                        method="put"
                        className="flex min-h-0 flex-1 flex-col"
                    >
                        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
                            <PasswordInput
                                label={t('account.current_password')}
                                name="current_password"
                                placeholder={t('account.current_password')}
                                autoComplete="current-password"
                            />
                            <PasswordInput
                                label={t('account.new_password')}
                                name="password"
                                placeholder={t('account.new_password')}
                                autoComplete="new-password"
                            />
                            <PasswordInput
                                label={t('account.confirm_new_password')}
                                name="password_confirmation"
                                placeholder={t('account.confirm_new_password')}
                                autoComplete="new-password"
                            />
                        </div>
                        <SheetFooter className="flex-row justify-end border-t px-5 py-4 sm:px-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                            >
                                {t('account.cancel')}
                            </Button>
                            <Button type="submit">
                                {t('account.change_password')}
                            </Button>
                        </SheetFooter>
                    </Form>
                </SheetContent>
            </Sheet>
        </div>
    );
}

function PasswordInput({
    label,
    name,
    placeholder,
    autoComplete,
}: {
    label: string;
    name: string;
    placeholder: string;
    autoComplete: string;
}) {
    const [visible, setVisible] = useState(false);
    const { t } = useAdminPanelI18n();

    return (
        <label className="flex flex-col gap-2 text-sm font-medium">
            {label}
            <InputGroup>
                <InputGroupInput
                    name={name}
                    type={visible ? 'text' : 'password'}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                />
                <InputGroupAddon align="inline-end">
                    <InputGroupButton
                        type="button"
                        size="icon-xs"
                        aria-label={
                            visible
                                ? t('account.hide_password')
                                : t('account.show_password')
                        }
                        aria-pressed={visible}
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => setVisible((value) => !value)}
                    >
                        {visible ? (
                            <EyeOffIcon aria-hidden="true" className="size-4" />
                        ) : (
                            <EyeIcon aria-hidden="true" className="size-4" />
                        )}
                    </InputGroupButton>
                </InputGroupAddon>
            </InputGroup>
        </label>
    );
}

function SecurityRow({
    label,
    onClick,
}: {
    label: string;
    onClick?: () => void;
}) {
    const { t } = useAdminPanelI18n();

    return (
        <div className="flex items-center justify-between gap-4 px-4 py-3">
            <p className="text-sm font-medium">{label}</p>
            <Button
                type="button"
                variant="outline"
                className="w-fit shrink-0"
                onClick={onClick}
            >
                {onClick ? t('account.change_password') : t('account.manage')}
            </Button>
        </div>
    );
}
