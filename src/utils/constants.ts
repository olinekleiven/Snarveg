import { Destination } from '../types';

export const TRANSPORT_MODE_EMOJIS = ['🚶‍♂️', '🚌', '🚈', '🚲', '🛳️', '🚕'];

export const INITIAL_DESTINATIONS: Destination[] = [
  { id: 'home', emoji: '📍', label: 'Min posisjon', color: '#3B82F6', position: { angle: 0, radius: 0 }, isCenter: true },
  { id: 'leiligheta', emoji: '🏠', label: 'Leiligheten', color: '#22C55E', position: { angle: 0, radius: 140 } },
  { id: 'trening', emoji: '💪', label: 'Trening', color: '#06B6D4', position: { angle: 72, radius: 140 } },
  { id: 'butikken', emoji: '🛍️', label: 'Butikken', color: '#3B82F6', position: { angle: 144, radius: 140 } },
  { id: 'biblioteket', emoji: '📚', label: 'Biblioteket', color: '#8B5CF6', position: { angle: 216, radius: 140 } },
  { id: 'studentsenteret', emoji: '🏫', label: 'Studentsenteret', color: '#F59E0B', position: { angle: 288, radius: 140 } },
  { id: 'leggtil', emoji: '+', label: 'Legg til sted', color: '#E5E7EB', position: { angle: 324, radius: 140 }, isEmpty: true },
];

export const STORAGE_KEYS = {
  ONBOARDING_COMPLETE: 'snarveg_onboarding_complete',
  PREFERENCES: 'snarveg_preferences',
  ACTIVE_TICKET: 'snarveg_active_ticket',
} as const;
