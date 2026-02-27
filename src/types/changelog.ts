export type ChangeAction = '新增' | '修改' | '删除';

export interface ChangeLogEntry {
  id: string;
  scholarId: string;
  scholarName: string;
  action: ChangeAction;
  field?: string;
  oldValue?: string;
  newValue?: string;
  description: string;
  operator: string;
  timestamp: string;
}
