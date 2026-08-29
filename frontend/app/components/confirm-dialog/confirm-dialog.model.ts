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
        | 'semis-save'
        | 'culture'
        | 'culture-reset'
        | 'culture-exit'
        | 'culture-save'
        | 'viability'
        | 'viability-reset'
        | 'viability-exit'
        | 'viability-save'
        | 'germination'
        | 'germination-reset'
        | 'germination-exit'
        | 'germination-save'
        | 'stock'
        | 'stock-reset'
        | 'stock-exit'
        | 'stock-save'
        | 'material'
        | 'material-reset'
        | 'material-exit'
        | 'material-save'
        | 'material-taxon-delete'
        | 'seed'
        | 'seed-reset'
        | 'seed-exit'
        | 'seed-save';
    disableClose?: boolean;
    entityCode?: string;
    entityLabel?: string;
    entityDate?: string;
    storageLocation?: string;
    warningMessage?: string;
    actionDeletion?: boolean;
    actionCancellation?: boolean;
    actionCancellationMode?: 'create' | 'edit';
    actionContextLabel?: string;
}