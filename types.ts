
export interface Project {
  id: number;
  name: string;
}

export interface Guarantee {
  id: number;
  name: string;
}

export interface Covenants {
  ltv: number | null;
  dscr: number | null;
}

export interface DefaultMonitoring {
  news: boolean;
  fiiReport: boolean;
  operationalInfo: boolean;
  receivablesPortfolio: boolean;
  monthlyConstructionReport: boolean;
  monthlyCommercialInfo: boolean;
  speDfs: boolean;
}

export interface Event {
  id: number;
  date: string; // ISO string
  type: string;
  title: string;
  description: string;
  registeredBy: string;
  nextSteps: string;
  completedTaskId?: string;
}

export type TaskPriority = 'Baixa' | 'Média' | 'Alta' | 'Urgente';

export interface TaskRule {
  id: number;
  name: string;
  frequency: 'Pontual' | 'Diário' | 'Semanal' | 'Quinzenal' | 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual' | 'Sem Prazo';
  startDate: string | null; // ISO string
  endDate: string | null; // ISO string
  description: string;
  priority?: TaskPriority;
}

export enum TaskStatus {
  PENDING = 'Pendente',
  OVERDUE = 'Atrasada',
  COMPLETED = 'Concluída'
}

export interface Task {
  id: string; // e.g., "op1-rule2-2024-08-15"
  operationId: number;
  ruleId: number;
  ruleName: string;
  dueDate?: string; // ISO string
  status: TaskStatus;
  priority?: TaskPriority;
  notes?: string;
}

export type Rating = 'A4' | 'Baa1' | 'Baa3' | 'Baa4' | 'Ba1' | 'Ba4' | 'Ba5' | 'Ba6' | 'B1' | 'B2' | 'B3' | 'B4' | 'C1' | 'C2' | 'C3';
export const ratingOptions: Rating[] = ['A4', 'Baa1', 'Baa3', 'Baa4', 'Ba1', 'Ba4', 'Ba5', 'Ba6', 'B1', 'B2', 'B3','B4', 'C1', 'C2', 'C3'];

export enum WatchlistStatus {
  VERDE = 'Verde',
  AMARELO = 'Amarelo',
  ROSA = 'Rosa',
  VERMELHO = 'Vermelho',
}

export enum Sentiment {
    POSITIVO = 'Positivo',
    NEUTRO = 'Neutro',
    NEGATIVO = 'Negativo'
}

export const segmentoOptions = [
    'Permuta',
    'Financiamento Construção',
    'Asset Finance',
    'Asset Finance - FII',
    'Crédito Corporativo',
    'Crédito Corporativo - Carteira',
    'Infra'
];

export type Area = 'CRI' | 'Capital Solutions';
export const areaOptions: Area[] = ['CRI', 'Capital Solutions'];

export interface RatingHistoryEntry {
    id: number;
    date: string; // ISO string
    ratingOperation: Rating;
    ratingGroup: Rating;
    watchlist: WatchlistStatus;
    sentiment: Sentiment;
    eventId: number;
}

export interface Operation {
  id: number;
  name: string;
  area: Area;
  projects: Project[];
  operationType: string;
  guarantees: Guarantee[];
  maturityDate: string; // ISO string
  responsibleAnalyst: string;
  reviewFrequency: string;
  callFrequency: string;
  dfFrequency: string;
  segmento: string;
  defaultMonitoring: DefaultMonitoring;
  covenants: Covenants;
  events: Event[];
  taskRules: TaskRule[];
  ratingOperation: Rating;
  ratingGroup: Rating;
  watchlist: WatchlistStatus;
  ratingHistory: RatingHistoryEntry[];
  tasks: Task[]; // Now provided by the backend
  overdueCount: number; // Now provided by the backend
  nextReviewGerencial?: string | null; // ISO string
  nextReviewPolitica?: string | null; // ISO string
  nextReviewGerencialTask?: Task | null;
  nextReviewPoliticaTask?: Task | null;
  notes?: string;
  estimatedDate?: string; // ISO string
}

export interface AuditLog {
    id: number;
    timestamp: string; // ISO string
    user_name: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    entity_type: string;
    entity_id: number | string;
    details: string;
}

export interface OperationReviewNote {
    operation_id: number;
    notes: string;
}

export enum Page {
  OVERVIEW = 'overview',
  DETAIL = 'detail',
  TASKS = 'tasks',
  CREDIT_REVIEWS = 'credit_reviews',
  AUDIT_LOG = 'audit_log',
  WATCHLIST = 'watchlist',
  ANALYST_HUB = 'analyst_hub',
}