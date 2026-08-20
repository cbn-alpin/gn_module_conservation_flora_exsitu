export interface ConfirmDialogData {
    title?: string;
    message: string;
    confirmCaption?: string;
    cancelCaption?: string;
    icon?: string;
    variant?:
        | 'semis'
        | 'culture'
        | 'viability'
        | 'germination'
        | 'stock'
        | 'material'
        | 'seed';
    disableClose?: boolean;
    entityCode?: string;
    entityLabel?: string;
    entityDate?: string;
    storageLocation?: string;
    warningMessage?: string;
}