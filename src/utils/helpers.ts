import { Connection, Route, Destination } from '../types';
import { TRANSPORT_MODE_EMOJIS } from './constants';

/**
 * Build a route from connections starting from 'home'
 */
export function buildRouteFromConnections(connections: Connection[]): Route | null {
  if (connections.length === 0) return null;

  // Build ordered route starting from 'home'
  const route: string[] = ['home'];
  let current = 'home';
  const visited = new Set(['home']);

  while (true) {
    const nextConn = connections.find(
      c => (c.from === current && !visited.has(c.to)) || 
           (c.to === current && !visited.has(c.from))
    );

    if (!nextConn) break;

    const next = nextConn.from === current ? nextConn.to : nextConn.from;
    route.push(next);
    visited.add(next);
    current = next;
  }

  if (route.length < 2) return null;

  const transportModes = connections
    .slice(0, route.length - 1)
    .map(c => c.transportMode || '🚶‍♂️');

  return {
    id: `route-${Date.now()}`,
    destinations: route,
    transportModes,
    totalTime: Math.floor(Math.random() * 60) + 20,
    totalDistance: Math.floor(Math.random() * 15) + 3,
  };
}

/**
 * Get a random transport mode emoji
 */
export function getRandomTransportMode(): string {
  return TRANSPORT_MODE_EMOJIS[Math.floor(Math.random() * TRANSPORT_MODE_EMOJIS.length)];
}

/**
 * Check if a connection already exists
 */
export function connectionExists(
  connections: Connection[], 
  from: string, 
  to: string
): boolean {
  return connections.some(
    c => (c.from === from && c.to === to) || (c.from === to && c.to === from)
  );
}

/**
 * Check if a node already has an outgoing connection
 */
export function hasOutgoingConnection(
  connections: Connection[], 
  nodeId: string
): boolean {
  return connections.some(c => c.from === nodeId);
}

/**
 * Rebuild connections from a new route order
 */
export function rebuildConnectionsFromOrder(
  newOrder: string[], 
  existingConnections: Connection[],
  transportModes: string[]
): Connection[] {
  const newConnections: Connection[] = [];
  
  for (let i = 0; i < newOrder.length - 1; i++) {
    const from = newOrder[i];
    const to = newOrder[i + 1];
    
    // Find existing connection to preserve transport mode
    const existingConn = existingConnections.find(
      c => (c.from === from && c.to === to) || (c.from === to && c.to === from)
    );
    
    newConnections.push({
      from,
      to,
      isLocked: existingConn?.isLocked || false,
      transportMode: existingConn?.transportMode || transportModes[i] || '🚶‍♂️',
      createdAt: existingConn?.createdAt || Date.now(),
    });
  }
  
  return newConnections;
}

/**
 * Check if there's an active ticket
 */
export function checkActiveTicket(): boolean {
  const saved = localStorage.getItem('snarveg_active_ticket');
  if (!saved) return false;
  
  try {
    const ticket = JSON.parse(saved);
    const expiresAt = new Date(ticket.expiresAt);
    return expiresAt > new Date();
  } catch {
    return false;
  }
}

/**
 * Calculate evenly distributed positions around a circle
 * @param count Number of nodes (excluding center)
 * @param radius Radius from center in pixels
 * @param startAngle Starting angle in degrees (default: 0)
 * @returns Array of angle positions in degrees
 */
export function calculateEvenDistribution(
  count: number,
  radius: number = 140,
  startAngle: number = 0
): number[] {
  if (count === 0) return [];
  
  const angles: number[] = [];
  const angleStep = 360 / count;
  
  for (let i = 0; i < count; i++) {
    angles.push((startAngle + i * angleStep) % 360);
  }
  
  return angles;
}

/**
 * Recalculate positions for all surrounding nodes to be evenly distributed
 * @param destinations All destinations (including center)
 * @param radius Radius from center in pixels
 * @returns Updated destinations with recalculated positions
 */
export function recalculateNodePositions(
  destinations: Destination[],
  radius: number = 140
): Destination[] {
  const centerNode = destinations.find(d => d.isCenter);
  const otherNodes = destinations.filter(d => !d.isCenter);
  
  if (otherNodes.length === 0) return destinations;
  
  const angles = calculateEvenDistribution(otherNodes.length, radius);
  
  const updatedNodes = otherNodes.map((node, index) => ({
    ...node,
    position: {
      angle: angles[index],
      radius: radius,
    },
  }));
  
  return centerNode ? [centerNode, ...updatedNodes] : updatedNodes;
}
