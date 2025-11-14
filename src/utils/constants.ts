import { Destination } from '../types';

export const TRANSPORT_MODE_EMOJIS = ['🚶‍♂️', '🚌', '🚈', '🚲', '🛳️', '🚕'];

export const INITIAL_DESTINATIONS: Destination[] = [
  { 
    id: 'home', 
    emoji: '📍', 
    label: 'Min posisjon', 
    color: '#3B82F6', 
    position: { angle: 0, radius: 0 }, 
    isCenter: true 
  },
  { 
    id: 'leiligheta', 
    emoji: '🏠', 
    label: 'Leiligheten', 
    color: '#22C55E', 
    position: { angle: 0, radius: 140 },
    address: 'Studentbolig, Bergen',
    notes: 'Hjemmeadresse. Husk nøkler!'
  },
  { 
    id: 'trening', 
    emoji: '💪', 
    label: 'Trening', 
    color: '#06B6D4', 
    position: { angle: 72, radius: 140 },
    address: 'Treningssenter, Bergen',
    notes: 'Trening 3 ganger i uken. Husk håndkle og vannflaske.'
  },
  { 
    id: 'butikken', 
    emoji: '🛍️', 
    label: 'Butikken', 
    color: '#3B82F6', 
    position: { angle: 144, radius: 140 },
    address: 'Nærbutikk, Bergen',
    notes: 'Handleliste: melk, brød, frukt. Åpningstider: 08:00-22:00'
  },
  { 
    id: 'biblioteket', 
    emoji: '📚', 
    label: 'Biblioteket', 
    color: '#8B5CF6', 
    position: { angle: 216, radius: 140 },
    address: 'Universitetsbiblioteket i Bergen, Haakon Sheteligs plass 7, 5007 Bergen',
    notes: 'Stille område for studier. Husk studentkort. Åpningstider: 08:00-22:00'
  },
  { 
    id: 'studentsenteret', 
    emoji: '🏫', 
    label: 'Studentsenteret', 
    color: '#F59E0B', 
    position: { angle: 288, radius: 140 },
    address: 'Studentsenteret, Parkveien 1, 5007 Bergen',
    notes: 'Møteplass for studenter. Kantine, kafe og studenttjenester. Åpningstider: 08:00-20:00'
  },
  { 
    id: 'leggtil', 
    emoji: '+', 
    label: 'Legg til sted', 
    color: '#E5E7EB', 
    position: { angle: 324, radius: 140 }, 
    isEmpty: true 
  },
];

export const STORAGE_KEYS = {
  ONBOARDING_COMPLETE: 'snarveg_onboarding_complete',
  PREFERENCES: 'snarveg_preferences',
  ACTIVE_TICKET: 'snarveg_active_ticket',
} as const;
