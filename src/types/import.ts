export interface ImportResult<T> {
  success: T[];
  errors: ImportError[];
  duplicates: T[];
}

export interface ImportError {
  row: number;
  data: Record<string, unknown>;
  error: string;
}

export interface ExcelColumn {
  key: string;
  label: string;
  required?: boolean;
  hint?: string;
  validator?: (value: unknown) => boolean;
}

export interface ImportProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  duplicates: number;
}
