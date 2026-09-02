export type CrudOption = {
    label: string;
    value?: string;
    variant?: 'default' | 'success' | 'warning' | 'destructive';
};

export type CrudIndexHeader = {
    title?: string;
    description?: string;
    activeTab?: string;
    tabs?: Array<{
        value: string;
        label: string;
        href: string;
    }>;
    stats?: Array<{
        key: string;
        label: string;
        value?: string | number;
        description?: string;
        details?: Array<{
            label: string;
            value: string | number;
        }>;
        tone?: 'default' | 'success' | 'warning' | 'danger';
    }>;
};

export type CrudColumn = {
    name: string;
    label: string;
    type:
        | 'text'
        | 'badge'
        | 'boolean'
        | 'datetime'
        | 'decimal'
        | 'signed-decimal'
        | 'identity'
        | 'json';
    detailOnly?: boolean;
    hidden?: boolean;
    searchable: boolean | string[];
    sortable: boolean;
    defaultSort?: 'asc' | 'desc';
    filterable: boolean;
    filter?: CrudFilterDefinition | null;
    link?: 'show';
    subtitle?: string;
    avatar?: string;
    options?: Record<string, CrudOption>;
    copyable?: boolean;
    truncate?: boolean;
    truncateMiddle?: boolean;
    signedColorReference?: string;
};

export type CrudFilterType = 'select' | 'text' | 'date' | 'number';

export type CrudFilterDefinition = {
    type: CrudFilterType;
    operators: string[];
};

export type CrudFilter = {
    field: string;
    operator: string;
    values: string[];
};

export type CrudField = {
    name: string;
    label: string;
    type:
        | 'text'
        | 'email'
        | 'password'
        | 'textarea'
        | 'key-value'
        | 'select'
        | 'boolean'
        | 'image'
        | 'image-url';
    required: boolean;
    requiredOnCreate: boolean;
    writeOnly: boolean;
    placeholder?: string;
    preview?: string;
    uploadUrl?: string;
    options?: CrudOption[];
    credentialOptions?: Record<string, CrudCredentialOption[]>;
};

export type CrudCredentialOption = {
    key: string;
    optional: boolean;
};

export type CrudFieldGroup = {
    columns: 2 | 3 | 4;
    fields: CrudField[];
};

export type CrudDefinition = {
    title: string;
    singularLabel: string;
    description?: string | null;
    showRowActions?: boolean;
    columns: CrudColumn[];
    fields: (CrudField | CrudFieldGroup)[];
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    bulkActions: CrudRecordAction[];
    permissions?: {
        create: boolean;
        update: boolean;
        delete: boolean;
        bulk: boolean;
    };
    showSearch?: boolean;
    showFilters?: boolean;
    showPagination?: boolean;
    showCreate?: boolean;
    showBulkActions?: boolean;
    createMode?: 'modal';
    editMode?: 'modal';
    showMode?: 'drawer';
    pagination: {
        defaultPerPage: number;
        perPageOptions: number[];
    };
};

export type CrudRecord = {
    key: string | number;
    routes: CrudRoutes;
    actions: CrudRecordAction[];
    title: string;
    values: Record<string, unknown>;
};

export type CrudRecordAction = {
    key: string;
    label: string;
    icon?: string;
    variant?: 'default' | 'destructive';
    method: 'post' | 'put' | 'patch' | 'delete';
    url: string;
    data?: Record<
        string,
        string | number | boolean | null | Array<string | number>
    >;
    confirmation?: {
        title: string;
        description: string;
        confirmLabel: string;
        processingLabel?: string;
    };
};

export type CrudRoutes = {
    index: string;
    create: string | null;
    show: string | null;
    edit: string | null;
    destroy: string | null;
    bulk: string | null;
};

export type CrudFilters = {
    search: string;
    sort: string;
    direction: 'asc' | 'desc';
    perPage: number;
    conditions: CrudFilter[];
};

export type PaginatedRecords = {
    data: CrudRecord[];
    current_page: number;
    from: number | null;
    last_page: number;
    next_page_url: string | null;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
};
