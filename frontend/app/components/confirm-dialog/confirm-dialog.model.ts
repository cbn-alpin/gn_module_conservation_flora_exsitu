export interface ConfirmDialogData {
    title?: string;
    message: string;
    confirmCaption?: string;
    cancelCaption?: string;
    icon?: string;
    variant?:
        | 'semis'
        | 'semis-reset'
        | 'culture'
        | 'culture-reset'
        | 'viability'
        | 'viability-reset'
        | 'germination'
        | 'germination-reset'
        | 'stock'
        | 'stock-reset'
        | 'material'
        | 'material-reset'
        | 'seed'
        | 'seed-reset';
    disableClose?: boolean;
    entityCode?: string;
    entityLabel?: string;
    entityDate?: string;
    storageLocation?: string;
    warningMessage?: string;
}