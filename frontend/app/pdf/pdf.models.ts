export type PdfDetailMode =
  | 'standard'
  | 'seed';


export type PdfActionContext =
  | 'standard'
  | 'culture';


export interface PdfField {
  label: string;
  value: string;
  fullWidth?: boolean;
}


export interface PdfSection {
  title: string;
  fields: PdfField[];
}


export interface PdfExportPayload {
  entityLabel: string;
  entityCode: string;
  accentColor: string;

  sections: PdfSection[];

  includeActions: boolean;
  actions: any[];

  actionContext: PdfActionContext;
}