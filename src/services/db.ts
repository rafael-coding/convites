export interface Client {
  id: string;
  slug: string;
  name: string;
  budget: number;
  entryFee: number;
  remaining: number;
  paymentStatus: 'pago' | 'pendente' | 'entrada';
  deliveryStatus: 'pendente' | 'concluido';
  partyTheme: string;
  referenceUrl: string;
  username: string;
  password: string;
  hash: string;
}

export interface Guest {
  id: string;
  name: string;
  confirmedAt: string;
}

export interface DatabaseState {
  clients: Client[];
  guests: Record<string, Guest[]>;
}

const STORAGE_KEY = 'ravbaby_db';

// Generates a slug from a name (e.g. "Endi Oliveira" -> "endi-oliveira")
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s-]/g, '') // remove special chars
    .trim()
    .replace(/\s+/g, '-');
}

// Generates a short secure random hash
export function generateHash(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let hash = '';
  for (let i = 0; i < 8; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `hash-${hash}`;
}

// Initialize database from localStorage or fetch from public/database.json
export async function initializeDatabase(): Promise<DatabaseState> {
  const localData = localStorage.getItem(STORAGE_KEY);
  if (localData) {
    try {
      const parsed = JSON.parse(localData);
      if (parsed && Array.isArray(parsed.clients)) {
        return parsed;
      }
    } catch (e) {
      console.error('Error parsing localStorage data, resetting...', e);
    }
  }

  // Fallback to fetch from database.json
  try {
    const res = await fetch('/database.json');
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    }
  } catch (e) {
    console.error('Failed to fetch initial database.json', e);
  }

  // Absolute fallback if everything fails
  const fallbackState: DatabaseState = { clients: [], guests: {} };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fallbackState));
  return fallbackState;
}

// Synchronous operations reading/writing to localStorage
export function getDatabaseStateSync(): DatabaseState {
  const localData = localStorage.getItem(STORAGE_KEY);
  if (localData) {
    try {
      return JSON.parse(localData);
    } catch (e) {
      // ignore
    }
  }
  return { clients: [], guests: {} };
}

export function saveDatabaseStateSync(state: DatabaseState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Clients Operations
export function getClients(): Client[] {
  return getDatabaseStateSync().clients;
}

export function getClientBySlug(slug: string): Client | undefined {
  return getClients().find(c => c.slug === slug);
}

export function getClientByHash(hash: string): Client | undefined {
  return getClients().find(c => c.hash === hash);
}

export function addClient(clientData: Omit<Client, 'id' | 'slug' | 'remaining' | 'username' | 'password' | 'hash'>): Client {
  const state = getDatabaseStateSync();
  
  // Calculate remaining
  const remaining = clientData.paymentStatus === 'pago' 
    ? 0 
    : clientData.paymentStatus === 'pendente' 
      ? clientData.budget 
      : clientData.budget - clientData.entryFee;

  const finalEntryFee = clientData.paymentStatus === 'pago' 
    ? clientData.budget 
    : clientData.paymentStatus === 'pendente' 
      ? 0 
      : clientData.entryFee;

  const id = `client-${Date.now()}`;
  const slug = generateSlug(clientData.name);
  
  // Auto-generate credentials
  const username = slug.split('-')[0] + Math.floor(Math.random() * 100);
  const password = Math.random().toString(36).slice(-6);
  const hash = generateHash();

  const newClient: Client = {
    ...clientData,
    id,
    slug,
    remaining,
    entryFee: finalEntryFee,
    username,
    password,
    hash
  };

  state.clients.push(newClient);
  if (!state.guests[id]) {
    state.guests[id] = [];
  }
  
  saveDatabaseStateSync(state);
  return newClient;
}

export function updateClient(clientId: string, updatedFields: Partial<Client>): Client {
  const state = getDatabaseStateSync();
  const index = state.clients.findIndex(c => c.id === clientId);
  if (index === -1) throw new Error('Client not found');

  const current = state.clients[index];
  const merged = { ...current, ...updatedFields };

  // Recalculate remaining
  merged.remaining = merged.paymentStatus === 'pago' 
    ? 0 
    : merged.paymentStatus === 'pendente' 
      ? merged.budget 
      : merged.budget - merged.entryFee;

  if (merged.paymentStatus === 'pago') {
    merged.entryFee = merged.budget;
  } else if (merged.paymentStatus === 'pendente') {
    merged.entryFee = 0;
  }

  // Regenerate slug if name changes
  if (updatedFields.name) {
    merged.slug = generateSlug(updatedFields.name);
  }

  state.clients[index] = merged;
  saveDatabaseStateSync(state);
  return merged;
}

export function deleteClient(clientId: string): void {
  const state = getDatabaseStateSync();
  state.clients = state.clients.filter(c => c.id !== clientId);
  delete state.guests[clientId];
  saveDatabaseStateSync(state);
}

// Guests Operations
export function getGuestsForClient(clientId: string): Guest[] {
  return getDatabaseStateSync().guests[clientId] || [];
}

export function addGuest(clientId: string, name: string): Guest {
  const state = getDatabaseStateSync();
  if (!state.guests[clientId]) {
    state.guests[clientId] = [];
  }

  const newGuest: Guest = {
    id: `guest-${Date.now()}`,
    name: name.trim(),
    confirmedAt: new Date().toISOString()
  };

  state.guests[clientId].push(newGuest);
  saveDatabaseStateSync(state);
  return newGuest;
}

export function updateGuest(clientId: string, guestId: string, name: string): Guest {
  const state = getDatabaseStateSync();
  const list = state.guests[clientId] || [];
  const index = list.findIndex(g => g.id === guestId);
  if (index === -1) throw new Error('Guest not found');

  const updatedGuest = { ...list[index], name: name.trim() };
  list[index] = updatedGuest;
  state.guests[clientId] = list;
  saveDatabaseStateSync(state);
  return updatedGuest;
}

export function deleteGuest(clientId: string, guestId: string): void {
  const state = getDatabaseStateSync();
  if (state.guests[clientId]) {
    state.guests[clientId] = state.guests[clientId].filter(g => g.id !== guestId);
    saveDatabaseStateSync(state);
  }
}
