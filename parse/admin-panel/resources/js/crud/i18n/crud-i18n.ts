import { useCallback, useMemo } from 'react';
import type { FilterI18nConfig } from '@admin-panel/ui';
import { useAdminPanelI18n } from '@admin-panel/i18n/admin-panel-i18n';

const operatorKeys = {
    is: 'is',
    is_not: 'is_not',
    is_any_of: 'is_any_of',
    is_not_any_of: 'is_not_any_of',
    includes_all: 'includes_all',
    excludes_all: 'excludes_all',
    before: 'before',
    after: 'after',
    between: 'between',
    not_between: 'not_between',
    contains: 'contains',
    not_contains: 'not_contains',
    starts_with: 'starts_with',
    ends_with: 'ends_with',
    is_exactly: 'is_exactly',
    equals: 'equals',
    not_equals: 'not_equals',
    greater_than: 'greater_than',
    less_than: 'less_than',
    overlaps: 'overlaps',
    includes: 'includes',
    excludes: 'excludes',
    includes_all_of: 'includes_all_of',
    includes_any_of: 'includes_any_of',
    empty: 'empty',
    not_empty: 'not_empty',
} as const;

export function useCrudI18n() {
    const { t } = useAdminPanelI18n();
    const translateOptionLabel = useCallback(
        (label: string) => {
            const translationKey =
                {
                    False: 'boolean.false',
                    True: 'boolean.true',
                }[label] ?? label;
            const translated = t(translationKey);

            return translated === translationKey ? label : translated;
        },
        [t],
    );
    const translateOperator = useCallback(
        (value: string) => {
            const key = `crud.filters.operators.${operatorKeys[value as keyof typeof operatorKeys] ?? value}`;
            const translated = t(key);

            return translated === key ? value.replaceAll('_', ' ') : translated;
        },
        [t],
    );
    const filterI18n = useMemo<Partial<FilterI18nConfig>>(
        () => ({
            addFilter: t('crud.filters.add'),
            addFilterTitle: t('crud.filters.add_title'),
            apply: t('crud.filters.apply'),
            cancel: t('common.cancel'),
            pickDate: t('crud.filters.pick_date'),
            pickDateRange: t('crud.filters.pick_date_range'),
            searchFields: t('crud.filters.search_fields'),
            noFieldsFound: t('crud.filters.no_fields'),
            noResultsFound: t('crud.filters.no_results'),
            select: t('crud.filters.select'),
            true: t('crud.filters.true'),
            false: t('crud.filters.false'),
            min: t('crud.filters.min'),
            max: t('crud.filters.max'),
            to: t('crud.filters.to'),
            typeAndPressEnter: t('crud.filters.type_and_enter'),
            selected: t('crud.filters.selected'),
            selectedCount: t('crud.filters.selected'),
            loadingOptions: t('crud.filters.loading'),
            errorLoadingOptions: t('crud.filters.load_error'),
            operators: {
                is: translateOperator('is'),
                isNot: translateOperator('is_not'),
                isAnyOf: translateOperator('is_any_of'),
                isNotAnyOf: translateOperator('is_not_any_of'),
                includesAll: translateOperator('includes_all'),
                excludesAll: translateOperator('excludes_all'),
                before: translateOperator('before'),
                after: translateOperator('after'),
                between: translateOperator('between'),
                notBetween: translateOperator('not_between'),
                contains: translateOperator('contains'),
                notContains: translateOperator('not_contains'),
                startsWith: translateOperator('starts_with'),
                endsWith: translateOperator('ends_with'),
                isExactly: translateOperator('is_exactly'),
                equals: translateOperator('equals'),
                notEquals: translateOperator('not_equals'),
                greaterThan: translateOperator('greater_than'),
                lessThan: translateOperator('less_than'),
                overlaps: translateOperator('overlaps'),
                includes: translateOperator('includes'),
                excludes: translateOperator('excludes'),
                includesAllOf: translateOperator('includes_all_of'),
                includesAnyOf: translateOperator('includes_any_of'),
                empty: translateOperator('empty'),
                notEmpty: translateOperator('not_empty'),
            },
            placeholders: {
                enterField: (field) => t('crud.filters.enter_field', { field }),
                selectField: t('crud.filters.select'),
                searchField: (field) =>
                    t('crud.filters.search_field', { field }),
                enterKey: t('crud.filters.enter_key'),
                enterValue: t('crud.filters.enter_value'),
            },
            helpers: {
                formatOperator: translateOperator,
            },
            validation: {
                invalidEmail: t('crud.filters.invalid_email'),
                invalidUrl: t('crud.filters.invalid_url'),
                invalidTel: t('crud.filters.invalid_tel'),
                invalid: t('crud.filters.invalid'),
            },
        }),
        [t, translateOperator],
    );
    const booleanOptions = useMemo(
        () => [
            {
                value: '0',
                label: t('boolean.false'),
                variant: 'default' as const,
            },
            {
                value: '1',
                label: t('boolean.true'),
                variant: 'success' as const,
            },
        ],
        [t],
    );

    return {
        booleanOptions,
        filterI18n,
        t,
        translateOperator,
        translateOptionLabel,
    };
}
