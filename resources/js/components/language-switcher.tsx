import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@admin-panel/ui/components/ui/dropdown-menu';
import { Button } from '@admin-panel/ui/components/ui/button';
import { RemixIcon } from '@admin-panel/ui/components/ui/remix-icon';
import { useAdminPanelI18n } from '../i18n/admin-panel-i18n';

export function LanguageSwitcher() {
    const { locale, setLocale, supportedLocales, t } = useAdminPanelI18n();
    const currentLocale = supportedLocales.find(
        (supported) => supported.locale === locale,
    );

    if (supportedLocales.length < 2) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        aria-label={t('locale.change')}
                    />
                }
            >
                <RemixIcon name="translate-2" />
                {currentLocale?.label ?? locale}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
                <DropdownMenuRadioGroup
                    value={locale}
                    onValueChange={setLocale}
                >
                    {supportedLocales.map((supported) => (
                        <DropdownMenuRadioItem
                            key={supported.locale}
                            value={supported.locale}
                        >
                            {supported.label}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
