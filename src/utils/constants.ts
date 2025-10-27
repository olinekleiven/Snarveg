import { Destination } from '../types';

export const TRANSPORT_MODE_EMOJIS = ['🚶‍♂️', '🚌', '🚈', '🚲', '🛳️', '🚕'];

export const INITIAL_DESTINATIONS: Destination[] = [
  { id: 'home', emoji: '📍', label: 'Min posisjon', color: '#3B82F6', position: { angle: 0, radius: 0 }, isCenter: true },
  { id: 'shopping', emoji: '🛍️', label: 'Shopping', color: '#06B6D4', position: { angle: 0, radius: 140 } },
  { id: 'park', emoji: '🌳', label: 'Park', color: '#22C55E', position: { angle: 45, radius: 140 } },
  { id: 'museum', emoji: '🏛️', label: 'Museum', color: '#8B5CF6', position: { angle: 90, radius: 140 } },
  { id: 'cafe', emoji: '☕', label: 'Kafé', color: '#F59E0B', position: { angle: 135, radius: 140 } },
  { id: 'beach', emoji: '🏖️', label: 'Strand', color: '#3B82F6', position: { angle: 180, radius: 140 } },
  { id: 'nightlife', emoji: '+', label: 'Legg til sted', color: '#E5E7EB', position: { angle: 225, radius: 140 }, isEmpty: true },
  { id: 'nature', emoji: '🌲', label: 'Natur', color: '#10B981', position: { angle: 270, radius: 140 } },
  { id: 'food', emoji: '🍽️', label: 'Mat', color: '#EF4444', position: { angle: 315, radius: 140 } },
];

export const STORAGE_KEYS = {
  ONBOARDING_COMPLETE: 'snarveg_onboarding_complete',
  PREFERENCES: 'snarveg_preferences',
  ACTIVE_TICKET: 'snarveg_active_ticket',
} as const;
