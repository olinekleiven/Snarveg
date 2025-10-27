export interface Destination {
  id: string;
  emoji: string;
  label: string;
  color: string;
  position: {
    angle: number; // degrees
    radius: number; // pixels from center
  };
  isCenter?: boolean;
  isEmpty?: boolean; // true if node is empty (shows "+" icon)
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  notes?: string;
  visitTime?: string; // ISO time format eller custom format
  customFields?: Record<string, string>; // Fleksible tilleggsfelt
}

export interface Connection {
  from: string;
  to: string;
  isLocked: boolean;
  transportMode?: string;
  createdAt?: number;
}

export interface Route {
  id: string;
  destinations: string[]; // array of destination IDs
  transportModes: string[]; // emoji for each leg
  totalTime: number; // minutes
  totalDistance: number; // km
  delay?: number; // minutes
  updates?: string[];
}

export interface UserPreferences {
  name: string;
  favoritePlaces: string[];
  transportModes: string[];
  notifications: boolean;
}
