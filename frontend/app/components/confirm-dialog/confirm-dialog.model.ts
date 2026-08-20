export interface ConfirmDialogData {
    title?: string;
    message: string;
    confirmCaption?: string;
    cancelCaption?: string;
    icon?: string;
    variant?:
        | 'semis'
        | 'semis-reset'
        | 'semis-exit'
        | 'culture'
        | 'culture-reset'
        | 'culture-exit'
        | 'viability'
        | 'viability-reset'
        | 'viability-exit'
        | 'germination'
        | 'germination-reset'
        | 'germination-exit'
        | 'stock'
        | 'stock-reset'
        | 'stock-exit'
        | 'material'
        | 'material-reset'
        | 'material-exit'
        | 'seed'
        | 'seed-reset'
        | 'seed-exit';
    disableClose?: boolean;
    entityCode?: string;
    entityLabel?: string;
    entityDate?: string;
    storageLocation?: string;
    warningMessage?: string;
}