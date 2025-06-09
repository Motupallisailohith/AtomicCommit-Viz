export interface Node {
  id: string;
  name: string;
  status: string;
  healthUrl: string;
}

export type TransactionPhase = 'PREPARE' | 'VOTING' | 'COMMIT' | 'ABORT' | 'COMPLETE';

export interface TransactionStatus {
  id: string;
  phase: TransactionPhase;
  startedAt: string;
  updatedAt: string;
}