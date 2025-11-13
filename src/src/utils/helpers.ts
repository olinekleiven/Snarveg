import { Connection, Route, Destination } from '../types';
import { TRANSPORT_MODE_EMOJIS } from './constants';

/**
 * Build a route from connections starting from 'home'
 */
export function buildRouteFromConnections(connections: Connection[]): Route | null {
  if (connections.length === 0) return null;

  const allNodes = new Set<string>();
  const incomingCount = new Map<string, number>();
  const outgoingCount = new Map<string, number>();

  connections.forEach(conn => {
    allNodes.add(conn.from);
    allNodes.add(conn.to);
    incomingCount.set(conn.to, (incomingCount.get(conn.to) ?? 0) + 1);
    outgoingCount.set(conn.from, (outgoingCount.get(conn.from) ?? 0) + 1);
  });

  let start: string | null = null;

  start = Array.from(allNodes).find(node => (incomingCount.get(node) ?? 0) === 0 && (outgoingCount.get(node) ?? 0) > 0) ?? null;

  if (!start) {
    start = connections[0]?.from ?? null;
  }

  if (!start) return null;

  const route: string[] = [start];
  const visitedNodes = new Set<string>([start]);
  const visitedConnections = new Set<number>();
  const orderedConnections: Connection[] = [];

  let current = start;

  while (true) {
    const nextIndex = connections.findIndex(
      (conn, idx) =>
        !visitedConnections.has(idx) &&
        conn.from === current &&
        !visitedNodes.has(conn.to)
    );

    if (nextIndex === -1) break;

    const nextConn = connections[nextIndex];
    visitedConnections.add(nextIndex);

    const nextNode = nextConn.to;
    orderedConnections.push(nextConn);
    route.push(nextNode);
    visitedNodes.add(nextNode);
    current = nextNode;
  }

  if (route.length < 2) return null;

  const transportModes = orderedConnections.map(conn => conn.transportMode || '🚶‍♂️');

  const baseTime = 12;
  const timePerLeg = 8;
  const baseDistance = 3;
  const distancePerLeg = 2.5;

  const totalTime = Math.round(baseTime + orderedConnections.length * timePerLeg);
  const totalDistance = Number((baseDistance + orderedConnections.length * distancePerLeg).toFixed(1));

  return {
    id: `route-${Date.now()}`,
    destinations: route,
    transportModes,
    totalTime,
    totalDistance,
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
