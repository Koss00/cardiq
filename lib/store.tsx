'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from 'react';
import { Card, CardSignal } from '@/types';

interface State {
  cards: Card[];
  signals: CardSignal[];
}

type Action =
  | { type: 'ADD_CARD'; card: Card }
  | { type: 'UPDATE_CARD'; id: string; updates: Partial<Card> }
  | { type: 'REMOVE_CARD'; id: string }
  | { type: 'SET_SIGNALS'; signals: CardSignal[] }
  | { type: 'ADD_SIGNAL'; signal: CardSignal }
  | { type: 'LOAD_STATE'; state: State };

const initialState: State = { cards: [], signals: [] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_CARD':
      return { ...state, cards: [action.card, ...state.cards] };
    case 'UPDATE_CARD':
      return {
        ...state,
        cards: state.cards.map((c) =>
          c.id === action.id ? { ...c, ...action.updates } : c
        ),
      };
    case 'REMOVE_CARD':
      return { ...state, cards: state.cards.filter((c) => c.id !== action.id) };
    case 'SET_SIGNALS':
      return { ...state, signals: action.signals };
    case 'ADD_SIGNAL': {
      const idx = state.signals.findIndex((s) => s.cardId === action.signal.cardId);
      const signals =
        idx >= 0
          ? state.signals.map((s, i) => (i === idx ? action.signal : s))
          : [...state.signals, action.signal];
      return { ...state, signals };
    }
    case 'LOAD_STATE':
      return action.state;
    default:
      return state;
  }
}

const StoreContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
} | null>(null);

// ─── DB sync helpers ──────────────────────────────────────────────────────────

function dbSaveCard(card: Card) {
  fetch('/api/portfolio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ card }),
  }).catch(() => {});
}

function dbDeleteCard(id: string) {
  fetch('/api/portfolio', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  }).catch(() => {});
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // On mount: load from DB first, fall back to localStorage
  useEffect(() => {
    fetch('/api/portfolio')
      .then((r) => r.json())
      .then(({ cards }: { cards: Card[] }) => {
        if (cards?.length) {
          // Merge signals from localStorage if present
          const saved = localStorage.getItem('cardiq-portfolio');
          const signals = saved ? (JSON.parse(saved) as State).signals ?? [] : [];
          dispatch({ type: 'LOAD_STATE', state: { cards, signals } });
          if (cards.length) {
            fetch('/api/signals/prefetch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ cards }),
            }).catch(() => {});
          }
        } else {
          // No DB data yet — load from localStorage (first-time migration)
          const saved = localStorage.getItem('cardiq-portfolio');
          if (saved) {
            try {
              const parsed: State = JSON.parse(saved);
              dispatch({ type: 'LOAD_STATE', state: parsed });
              // Migrate existing cards up to DB
              parsed.cards?.forEach((card) => dbSaveCard(card));
              if (parsed.cards?.length) {
                fetch('/api/signals/prefetch', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ cards: parsed.cards }),
                }).catch(() => {});
              }
            } catch {}
          }
        }
      })
      .catch(() => {
        // DB unavailable — fall back to localStorage
        const saved = localStorage.getItem('cardiq-portfolio');
        if (saved) {
          try {
            dispatch({ type: 'LOAD_STATE', state: JSON.parse(saved) });
          } catch {}
        }
      });
  }, []);

  // Keep localStorage in sync as instant local cache
  useEffect(() => {
    localStorage.setItem('cardiq-portfolio', JSON.stringify(state));
  }, [state]);

  // Wrap dispatch to sync card mutations to DB
  const syncDispatch: React.Dispatch<Action> = (action) => {
    dispatch(action);
    if (action.type === 'ADD_CARD')    dbSaveCard(action.card);
    if (action.type === 'UPDATE_CARD') {
      // Build the updated card from current state for DB upsert
      const card = state.cards.find((c) => c.id === action.id);
      if (card) dbSaveCard({ ...card, ...action.updates });
    }
    if (action.type === 'REMOVE_CARD') dbDeleteCard(action.id);
  };

  return (
    <StoreContext.Provider value={{ state, dispatch: syncDispatch }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
