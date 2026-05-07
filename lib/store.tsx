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

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const saved = localStorage.getItem('cardiq-portfolio');
    if (saved) {
      try {
        const parsed: State = JSON.parse(saved);
        dispatch({ type: 'LOAD_STATE', state: parsed });
        // Silently warm the server-side signal cache in the background
        if (parsed.cards?.length) {
          fetch('/api/signals/prefetch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cards: parsed.cards }),
          }).catch(() => {});
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cardiq-portfolio', JSON.stringify(state));
  }, [state]);

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
