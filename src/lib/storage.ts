import { JurisdictionKey, PermitCategoryKey, SearchRecord } from '../types';
import { DEFAULT_GUEST_HISTORY } from '../data/demoRecords';

const SESSION_KEY = 'permitlens.guest-session.v1';
const CHECKLIST_KEY = 'permitlens.checklist.v1';
const QUERY_KEY = 'permitlens.last-query.v1';

export interface GuestSession {
  history: SearchRecord[];
  currentRecordId: string | null;
  selectedJurisdiction: JurisdictionKey;
  selectedCategory: PermitCategoryKey;
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota or private-mode failures so the app still runs.
  }
}

export function loadGuestSession(): GuestSession {
  const saved = readJson<GuestSession>(SESSION_KEY);
  if (!saved || !Array.isArray(saved.history)) {
    return {
      history: DEFAULT_GUEST_HISTORY,
      currentRecordId: DEFAULT_GUEST_HISTORY[0]?.id ?? null,
      selectedJurisdiction: 'los_angeles',
      selectedCategory: 'electrical_upgrade'
    };
  }
  return {
    history: saved.history,
    currentRecordId: saved.currentRecordId,
    selectedJurisdiction: saved.selectedJurisdiction || 'los_angeles',
    selectedCategory: saved.selectedCategory || 'electrical_upgrade'
  };
}

export function saveGuestSession(session: GuestSession): void {
  writeJson(SESSION_KEY, session);
}

export function loadChecklist(recordId: string): Record<string, boolean> {
  const all = readJson<Record<string, Record<string, boolean>>>(CHECKLIST_KEY) || {};
  return all[recordId] || {};
}

export function saveChecklist(recordId: string, completed: Record<string, boolean>): void {
  const all = readJson<Record<string, Record<string, boolean>>>(CHECKLIST_KEY) || {};
  all[recordId] = completed;
  writeJson(CHECKLIST_KEY, all);
}

export function loadLastQuery(): string {
  try {
    return localStorage.getItem(QUERY_KEY) || '';
  } catch {
    return '';
  }
}

export function saveLastQuery(query: string): void {
  try {
    localStorage.setItem(QUERY_KEY, query);
  } catch {
    // Ignore storage failures.
  }
}
