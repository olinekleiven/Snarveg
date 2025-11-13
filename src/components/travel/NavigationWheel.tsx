import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit, Check } from 'lucide-react';
import DestinationNode from './DestinationNode';
import DrawingLine from './DrawingLine';
import { Destination, Connection } from './types';
import { toast } from 'sonner';

interface NavigationWheelProps {
  destinations: Destination[];
  connections: Connection[];
  onConnectionCreate: (from: string, to: string) => void;
  onConnectionLock: (from: string, to: string) => void;
  onNodeClick?: (destination: Destination) => void;
  maxDestinations?: number; // Maximum number of destinations (excluding center)
  deletingNodeId?: string | null; // ID of node currently being deleted
  isEditMode?: boolean; // Whether edit mode is active
  onNodeSwap?: (nodeId1: string, nodeId2: string) => void; // Callback when two nodes swap positions
  onNodeDelete?: (nodeId: string) => void; // Callback when node delete button is clicked
  onEditModeToggle?: () => void; // Callback to toggle edit mode
}

export default function NavigationWheel({
  destinations,
  connections,
  onConnectionCreate,
  onConnectionLock,
  onNodeClick,
  maxDestinations = 20,
  deletingNodeId = null,
  isEditMode = false,
  onNodeSwap,
  onNodeDelete,
  onEditModeToggle,
}: NavigationWheelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const wheelContainerRef = useRef<HTMLDivElement>(null); // Ref for the wheel container (with pt-28)
  
  // LINE_Y_CAL brukes for visuell kalibrering av linjer (60px ned for perfekt sentrering).
  // Endre verdien for å finjustere senterposisjon etter behov.
  // Global Y-calibration offset for all line endpoints
  // Adjusts all line start/end points downward to match visual node centers
  // Can be tuned via CSS variable --line-y-cal for live adjustment in devtools
  const LINE_Y_CAL = 60; // Endelig vertikal kalibrering for linjer (flytter alt 60px ned for perfekt sentrering i midten av nodene)
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ id: string; x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [lockTimer, setLockTimer] = useState<NodeJS.Timeout | null>(null);
  const [lockingConnection, setLockingConnection] = useState<{ from: string; to: string } | null>(null);
  const [lockProgress, setLockProgress] = useState(0);
  const [carAnimation, setCarAnimation] = useState<{ from: string; to: string } | null>(null);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
  const [hoverStartTime, setHoverStartTime] = useState<number | null>(null);
  const hoverProgressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [longPressNodeId, setLongPressNodeId] = useState<string | null>(null);
  const [pointerStartPos, setPointerStartPos] = useState<{ x: number; y: number } | null>(null);
  const [pointerDownNodeId, setPointerDownNodeId] = useState<string | null>(null);
  const connectionCreatedRef = useRef<boolean>(false); // Track if connection was created in this drag session
  const isProcessingConnectionRef = useRef<boolean>(false); // Guard against multiple simultaneous connection creations
  const pendingConnectionRef = useRef<{ from: string; to: string } | null>(null); // Track pending connection to prevent duplicate rendering
  
  // Performance: Cache LINE_Y_CAL value to avoid getComputedStyle calls on every move
  const lineYCalRef = useRef<number>(LINE_Y_CAL);
  
  // Update cached value periodically (not on every move)
  useEffect(() => {
    const updateCal = () => {
      lineYCalRef.current = Number(getComputedStyle(document.documentElement).getPropertyValue('--line-y-cal') || LINE_Y_CAL);
    };
    updateCal();
    // Update every 500ms instead of on every move
    const interval = setInterval(updateCal, 500);
    return () => clearInterval(interval);
  }, []);
  
  // Track animation frame for smooth drawCurrent updates
  const lastMoveTimeRef = useRef<number>(0);
  
  // Edit mode state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [dragStartAngle, setDragStartAngle] = useState<number | null>(null);
  const [dragCurrentPos, setDragCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredSwapNodeId, setHoveredSwapNodeId] = useState<string | null>(null);
  const [swapAnimation, setSwapAnimation] = useState<{ from: string; to: string } | null>(null);

  // Memoize node arrays to avoid recalculating on every render
  const centerNode = useMemo(() => destinations.find(d => d.isCenter), [destinations]);
  const otherNodes = useMemo(() => destinations.filter(d => !d.isCenter), [destinations]);
  const filledNodes = useMemo(() => otherNodes.filter(d => !d.isEmpty), [otherNodes]);

  // Compute evenly spaced angles for the non-center nodes so they are
  // distributed evenly around the wheel regardless of their initial values.
  const computedAngles = useMemo(() => {
    const map = new Map<string, number>();
    const nodes = otherNodes;
    const count = nodes.length;
    if (count === 0) return map;

    // Start at angle 0 (pointing to the right). You can change startAngle
    // to -90 to start at the top if preferred.
    const startAngle = 0;
    const step = 360 / count;

    nodes.forEach((node, idx) => {
      map.set(node.id, startAngle + idx * step);
    });

    return map;
  }, [otherNodes]);
  
  // Check if we've reached the maximum limit (count only filled destinations, not empty "+" nodes)
  const hasReachedMax = useMemo(() => filledNodes.length >= maxDestinations, [filledNodes, maxDestinations]);

  // Memoize unique connections to prevent duplicate rendering
  // This is the SINGLE SOURCE OF TRUTH for rendering connections
  const uniqueConnections = useMemo(() => {
    const seen = new Set<string>();
    const unique: Connection[] = [];
    
    for (const conn of connections) {
      const key = `${conn.from}-${conn.to}`;
      const reverseKey = `${conn.to}-${conn.from}`;
      
      // Check both directions to prevent duplicates
      if (!seen.has(key) && !seen.has(reverseKey)) {
        seen.add(key);
        seen.add(reverseKey);
        unique.push(conn);
      }
    }
    
    return unique;
  }, [connections]);

  const getNodePosition = (angle: number, radius: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: Math.cos(rad) * radius,
      y: Math.sin(rad) * radius,
    };
  };

  /**
   * Get node screen position relative to container (for SVG coordinates)
   * Uses same coordinate system as mouse events (e.clientX/Y - rect.left/top)
   * All calculations use containerRef.getBoundingClientRect() for consistency
   * 
   * The wheel container has pt-28 (112px padding-top), and nodes are positioned
   * relative to the wheel center within that container. This function calculates
   * the actual screen position accounting for the container's coordinate system.
   */
  const getNodeScreenPosition = (dest: Destination) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    
    // Use same rect as mouse move events - this is our single source of truth
    // This rect represents the entire container (including padding area)
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Get wheel container rect to calculate actual wheel center position
    // The wheel container has pt-28 (112px) padding-top
    let wheelCenterY: number;
    if (wheelContainerRef.current) {
      const wheelRect = wheelContainerRef.current.getBoundingClientRect();
      // Wheel center is at the center of the wheel container (which accounts for pt-28)
      // Convert to container-relative coordinates
      wheelCenterY = wheelRect.top - containerRect.top + wheelRect.height / 2;
    } else {
      // Fallback: calculate based on known padding (datadriven from CSS pt-28 = 112px)
      // This matches the visual layout where wheel is centered in remaining space after padding
      const paddingTop = 112; // pt-28 = 112px (matches CSS class)
      wheelCenterY = paddingTop + (containerRect.height - paddingTop) / 2;
    }
    
    const centerX = containerRect.width / 2;
    
    if (dest.isCenter) {
      // Center node is at the wheel center
      return { x: centerX, y: wheelCenterY };
    }
    
    // For other nodes: calculate position based on angle and radius
    // Use computed angle when available so nodes are evenly spaced
    const angle = computedAngles.get(dest.id) ?? dest.position.angle;
    const pos = getNodePosition(angle, dest.position.radius);
    
    return {
      x: centerX + pos.x,
      y: wheelCenterY + pos.y,
    };
  };

  const handlePointerDown = (e: React.PointerEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const dest = destinations.find(d => d.id === nodeId);
    if (!dest) return;
    
    // In edit mode, handle drag-and-drop or tap to edit
    if (isEditMode) {
      // Don't allow dragging center node or empty nodes
      if (dest.isCenter || dest.isEmpty || dest.label === 'Legg til sted') {
        // For empty nodes, still allow clicking to add
        if ((dest.isEmpty || dest.label === 'Legg til sted') && onNodeClick) {
          if (hasReachedMax) {
            toast.error('Maks 20 destinasjoner', {
              duration: 2500,
              style: {
                background: '#EF4444',
                color: '#FFFFFF',
                border: 'none',
              },
            });
            if (navigator.vibrate) {
              navigator.vibrate(100);
            }
            return;
          }
          onNodeClick(dest);
          if (navigator.vibrate) {
            navigator.vibrate(50);
          }
        }
        // For center node, allow tap to edit
        if (dest.isCenter && onNodeClick) {
          onNodeClick(dest);
          if (navigator.vibrate) {
            navigator.vibrate(50);
          }
        }
        return;
      }
      
      // Store initial position for tap/drag detection
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setPointerStartPos({ x: e.clientX, y: e.clientY });
        setPointerDownNodeId(nodeId);
        
        // Start dragging immediately - tap detection happens on pointer up
        const angle = computedAngles.get(nodeId) ?? dest.position.angle;
        const startPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        setDraggingNodeId(nodeId);
        setDragStartPos(startPos);
        setDragCurrentPos(startPos); // Initialize current pos to start pos
        setDragStartAngle(angle);
        
        // Set pointer capture on the container for smooth dragging
        if (containerRef.current) {
          containerRef.current.setPointerCapture(e.pointerId);
        }
      }
      return;
    }
    
    // Normal mode behavior (existing code)
    // If this is an empty node, check if we can add more
    if (dest.isEmpty || dest.label === 'Legg til sted') {
      // Check if we've reached the maximum limit
      if (hasReachedMax) {
        toast.error('Maks 20 destinasjoner', {
          duration: 2500,
          style: {
            background: '#EF4444',
            color: '#FFFFFF',
            border: 'none',
          },
        });
        if (navigator.vibrate) {
          navigator.vibrate(100);
        }
        return;
      }
      
      if (onNodeClick) {
        onNodeClick(dest);
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
      return;
    }
    
    // Store initial position for click detection
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setPointerStartPos({ x: e.clientX, y: e.clientY });
      setPointerDownNodeId(nodeId);
    }
    
    // Start long-press timer (700ms) to open edit modal for filled nodes
    const timer = setTimeout(() => {
      const destination = destinations.find(d => d.id === nodeId);
      if (destination && onNodeClick) {
        // Cancel any ongoing drawing
        setIsDrawing(false);
        setDrawStart(null);
        setDrawCurrent(null);
        setHoveredNode(null);
        
        // Open edit modal
        onNodeClick(destination);
        
        // Provide haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
    }, 700);
    
    setLongPressTimer(timer);
    setLongPressNodeId(nodeId);

    // Check if this node can start a drawing
    const canDrawFrom = canNodeStartDrawing(nodeId);
    if (!canDrawFrom.allowed) {
      // Show error message
      toast.error(canDrawFrom.message, {
        duration: 2500,
        style: {
          background: '#EF4444',
          color: '#FFFFFF',
          border: 'none',
        },
      });
      return;
    }

    // Get node position relative to container (for SVG coordinates)
    // getNodeScreenPosition already returns coordinates relative to container
    const nodePos = getNodeScreenPosition(dest);
    
    // Apply Y-calibration offset to line endpoints (use cached value)
    const dy = lineYCalRef.current;
    
    // Reset processing flags when starting new drawing
    connectionCreatedRef.current = false;
    isProcessingConnectionRef.current = false;
    
    setIsDrawing(true);
    setDrawStart({ id: nodeId, x: nodePos.x, y: nodePos.y + dy });
    setDrawCurrent({ x: nodePos.x, y: nodePos.y + dy });
  };

  // Helper function to reset all drawing state COMPLETELY
  // CRITICAL: This must clear EVERYTHING to prevent hanging lines/arrows
  const resetDrawingState = useCallback(() => {
    // Cancel any pending animation frames FIRST
    if (lastMoveTimeRef.current) {
      cancelAnimationFrame(lastMoveTimeRef.current);
      lastMoveTimeRef.current = 0;
    }
    
    // Clear all drawing state
    setIsDrawing(false);
    setDrawStart(null);
    setDrawCurrent(null);
    setHoveredNode(null);
    setLockProgress(0);
    setHoverStartTime(null);
    setLockingConnection(null);
    
    // Clear all refs and flags
    connectionCreatedRef.current = false;
    isProcessingConnectionRef.current = false;
    pendingConnectionRef.current = null;
    
    // Clear all timers
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
    if (hoverProgressIntervalRef.current) {
      clearInterval(hoverProgressIntervalRef.current);
      hoverProgressIntervalRef.current = null;
    }
  }, [hoverTimer]);

  // Helper function to check if a node can start a drawing
  const canNodeStartDrawing = useCallback((nodeId: string): { allowed: boolean; message?: string } => {
    const destination = destinations.find(d => d.id === nodeId);
    
    // Check if target node is empty (isEmpty or has no name)
    if (destination?.isEmpty || !destination?.label || destination?.label.trim() === '' || destination?.label === 'Legg til sted') {
      return {
        allowed: false,
        message: 'Du kan ikke koble til en tom node. Fyll inn node først!',
      };
    }
    
    const isHomeNode = nodeId === 'home';
    
    // If no connections exist yet, only home can start drawing
    if (connections.length === 0) {
      return {
        allowed: isHomeNode,
        message: isHomeNode ? undefined : 'Start reisen fra din posisjon (senteret)',
      };
    }
    
    // Check if home already has ANY connection (locked or unlocked)
    // Home node can ONLY draw once - to the first destination
    if (isHomeNode) {
      const homeHasAnyConnection = connections.some(c => c.from === 'home' || c.to === 'home');
      if (homeHasAnyConnection) {
        return {
          allowed: false,
          message: 'Fortsett reisen fra den noden du kobla til! Min posisjon kan kun koble til første stad.',
        };
      }
      return { allowed: true };
    }
    
    // For other nodes, they can draw if they are being pointed TO
    // A node needs to be the destination (to) of at least one connection
    const isPointedTo = connections.some(c => c.to === nodeId);
    
    if (!isPointedTo) {
      return {
        allowed: false,
        message: 'Ein node må bli peikt på før den kan peike vidare',
      };
    }
    
    // Check if this node already has an outgoing connection (from this node)
    // Each node can only point to ONE other node
    const hasOutgoingConnection = connections.some(c => c.from === nodeId);
    if (hasOutgoingConnection) {
      return {
        allowed: false,
        message: 'Denne noden har allereie ein forbindelse vidare',
      };
    }
    
    return { allowed: true };
  }, [destinations, connections]);

  const handleContextMenu = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const destination = destinations.find(d => d.id === nodeId);
    if (destination && onNodeClick) {
      onNodeClick(destination);
    }
  }, [destinations, onNodeClick]);

  const handlePointerMove = (e: React.PointerEvent) => {
    // Handle drag-and-drop in edit mode - allow visual dragging and swapping
    if (isEditMode && draggingNodeId && dragStartPos && dragStartAngle !== null && containerRef.current) {
      // Use same rect as getNodeScreenPosition() for coordinate system consistency
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Update current drag position for visual feedback
      setDragCurrentPos({ x: mouseX, y: mouseY });
      
      // Check if hovering over another node to swap positions
      // Use getNodeScreenPosition to get exact node position (includes correct offset)
      const hoveredDest = otherNodes.find(dest => {
        if (dest.id === draggingNodeId || dest.isCenter || dest.isEmpty || dest.label === 'Legg til sted') {
          return false;
        }
        // Use getNodeScreenPosition to get exact node position with correct offset
        const nodePos = getNodeScreenPosition(dest);
        
        const dx = mouseX - nodePos.x;
        const dy = mouseY - nodePos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < 50; // 50px hit radius
      });
      
      if (hoveredDest) {
        setHoveredSwapNodeId(hoveredDest.id);
      } else {
        setHoveredSwapNodeId(null);
      }
      return;
    }
    
    // Cancel long-press if pointer moves significantly
    if (longPressTimer && pointerStartPos) {
      const dx = e.clientX - pointerStartPos.x;
      const dy = e.clientY - pointerStartPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 10) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
        setLongPressNodeId(null);
      }
    }
    
    // CRITICAL: Don't allow drawing if connection was already created in this session
    // Also check if we're processing a connection to prevent overlapping
    if (!isDrawing || !containerRef.current || !drawStart || connectionCreatedRef.current || isProcessingConnectionRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    // Mouse position relative to container (matches SVG coordinate system)
    const mousePos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    
    // Apply Y-calibration offset to line endpoints (use cached value)
    const dy = lineYCalRef.current;
    
    // Update drawCurrent immediately for smooth, responsive line following
    // Use requestAnimationFrame for smooth updates without blocking
    if (!lastMoveTimeRef.current) {
      lastMoveTimeRef.current = requestAnimationFrame(() => {
        setDrawCurrent({ x: mousePos.x, y: mousePos.y + dy });
        lastMoveTimeRef.current = 0;
      });
    } else {
      // Cancel previous frame and schedule new one
      cancelAnimationFrame(lastMoveTimeRef.current);
      lastMoveTimeRef.current = requestAnimationFrame(() => {
        setDrawCurrent({ x: mousePos.x, y: mousePos.y + dy });
        lastMoveTimeRef.current = 0;
      });
    }

    // Check if hovering over a node
    const hoveredDest = destinations.find(dest => {
      if (dest.id === drawStart.id) return false;
      
      // Don't allow hovering over empty nodes
      if (dest.isEmpty || !dest.label || dest.label.trim() === '' || dest.label === 'Legg til sted') {
        return false;
      }
      
      const pos = getNodeScreenPosition(dest);
      const dx = (e.clientX - rect.left) - pos.x;
      const dy = (e.clientY - rect.top) - pos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      return distance < 50; // 50px hit radius
    });

    const newHoveredNode = hoveredDest?.id || null;

    // If we started hovering over a new node, start the auto-lock timer
    if (newHoveredNode && newHoveredNode !== hoveredNode) {
      // Clear any existing hover timer
      if (hoverTimer) {
        clearTimeout(hoverTimer);
      }
      if (hoverProgressIntervalRef.current) {
        clearInterval(hoverProgressIntervalRef.current);
      }

      // Start new hover timer
      const startTime = Date.now();
      setHoverStartTime(startTime);
      const lockDuration = 1000; // 1 second to auto-lock

      // Progress animation
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / lockDuration, 1);
        setLockProgress(progress);

        if (progress >= 1) {
          clearInterval(progressInterval);
        }
      }, 16);
      hoverProgressIntervalRef.current = progressInterval;

      // Auto-lock timer - only sets up locking state, does NOT create connection or start animation
      // Connection creation and car animation happen in handlePointerUp when pointer is released
      // CRITICAL: Do NOT set lockingConnection here - it causes duplicate rendering!
      // The connection will render from uniqueConnections when created
      const timer = setTimeout(() => {
        // Just mark that this connection should be locked when pointer is released
        // Don't create connection or start animation here - that happens in handlePointerUp
        // Don't set lockingConnection - it will cause duplicate lines!
      }, lockDuration);

      setHoverTimer(timer);
    } else if (!newHoveredNode && hoveredNode) {
      // Stopped hovering, cancel timer
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        setHoverTimer(null);
      }
      if (hoverProgressIntervalRef.current) {
        clearInterval(hoverProgressIntervalRef.current);
        hoverProgressIntervalRef.current = null;
      }
      setLockProgress(0);
      setHoverStartTime(null);
    }

    setHoveredNode(newHoveredNode);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    // Cancel any pending animation frames to prevent hanging arrows
    if (lastMoveTimeRef.current) {
      cancelAnimationFrame(lastMoveTimeRef.current);
      lastMoveTimeRef.current = 0;
    }

    // Handle drag-and-drop end in edit mode
    if (isEditMode) {
      // If we were dragging and hovering over another node, swap positions
      if (draggingNodeId && hoveredSwapNodeId) {
        const draggingNode = destinations.find(d => d.id === draggingNodeId);
        const swapNode = destinations.find(d => d.id === hoveredSwapNodeId);
        
        if (draggingNode && swapNode && onNodeSwap) {
          // Trigger swap animation
          setSwapAnimation({ from: draggingNodeId, to: hoveredSwapNodeId });
          
          // Swap the nodes in the array (this maintains defined positions)
          onNodeSwap(draggingNodeId, hoveredSwapNodeId);
          
          // Provide haptic feedback
          if (navigator.vibrate) {
            navigator.vibrate(100);
          }
          
          // Clear animation after a short delay
          setTimeout(() => {
            setSwapAnimation(null);
          }, 300);
        }
        
        setHoveredSwapNodeId(null);
      }
      
      // If we were dragging, end the drag
      if (draggingNodeId) {
        setDraggingNodeId(null);
        setDragStartPos(null);
        setDragStartAngle(null);
        setDragCurrentPos(null);
        // Release pointer capture
        if (containerRef.current) {
          containerRef.current.releasePointerCapture(e.pointerId);
        }
      }
      
      // Check if this was a tap (not a drag) to open edit modal
      if (pointerDownNodeId && pointerStartPos && !draggingNodeId) {
        const dest = destinations.find(d => d.id === pointerDownNodeId);
        if (dest && !dest.isCenter && !dest.isEmpty && dest.label !== 'Legg til sted') {
          const dx = e.clientX - pointerStartPos.x;
          const dy = e.clientY - pointerStartPos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // If moved less than 10px, treat as tap
          if (distance < 10 && onNodeClick) {
            onNodeClick(dest);
            if (navigator.vibrate) {
              navigator.vibrate(50);
            }
          }
        }
      }
      
      // Clear timers
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
      setPointerStartPos(null);
      setPointerDownNodeId(null);
      return;
    }
    
    // Clear long-press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
      setLongPressNodeId(null);
    }
    
    // Clear hover timer if user releases
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
    if (hoverProgressIntervalRef.current) {
      clearInterval(hoverProgressIntervalRef.current);
      hoverProgressIntervalRef.current = null;
    }
    
    // Reset pointer tracking
    setPointerStartPos(null);
    setPointerDownNodeId(null);

    // If not drawing, reset everything
    if (!isDrawing || !drawStart) {
      resetDrawingState();
      isProcessingConnectionRef.current = false;
      return;
    }

    // Check if released on a valid node (manual release before auto-lock)
    if (hoveredNode && hoveredNode !== drawStart.id) {
      // GUARD: Prevent multiple simultaneous connection creations
      if (isProcessingConnectionRef.current) {
        resetDrawingState();
        return;
      }
      
      // Mark that we're processing a connection IMMEDIATELY
      isProcessingConnectionRef.current = true;
      
      // Save values BEFORE any state changes
      const fromId = drawStart.id;
      const toId = hoveredNode;
      
      // Check if connection already exists to prevent duplicates
      const alreadyExists = connections.some(
        c => c.from === fromId && c.to === toId
      );
      
      // Check BOTH in connections AND uniqueConnections to be absolutely sure
      const existsInConnections = connections.some(
        c => (c.from === fromId && c.to === toId) || (c.from === toId && c.to === fromId)
      );
      const existsInUnique = uniqueConnections.some(
        c => (c.from === fromId && c.to === toId) || (c.from === toId && c.to === fromId)
      );
      
      if (alreadyExists || existsInConnections || existsInUnique) {
        // Connection already exists, reset everything immediately
        resetDrawingState();
        isProcessingConnectionRef.current = false;
        pendingConnectionRef.current = null;
        return;
      }
      
      // Mark that we've created a connection in this session BEFORE creating it
      connectionCreatedRef.current = true;
      
      // CRITICAL: Set pending connection ref FIRST to prevent any rendering overlap
      pendingConnectionRef.current = { from: fromId, to: toId };
      
      // CRITICAL: Clear drawing state IMMEDIATELY and COMPLETELY before creating connection
      // This prevents overlapping rendering of isDrawing line and lockingConnection
      setIsDrawing(false);
      setDrawStart(null);
      setDrawCurrent(null); // Clear drawCurrent to remove hanging arrows
      setHoveredNode(null);
      setLockProgress(0);
      setHoverStartTime(null);
      
      // Cancel any pending animation frames to prevent hanging arrows
      if (lastMoveTimeRef.current) {
        cancelAnimationFrame(lastMoveTimeRef.current);
        lastMoveTimeRef.current = 0;
      }
      
      // Create connection - DO NOT set lockingConnection here!
      // The connection will appear in uniqueConnections and render automatically
      // Setting lockingConnection here causes duplicate rendering
      onConnectionCreate(fromId, toId);
      
      // Start car animation
      setCarAnimation({ from: fromId, to: toId });

      // CRITICAL: Do NOT set lockingConnection here - it causes duplicate rendering!
      // The connection will render from uniqueConnections immediately
      // We only need the lock timer for the lock animation
      
      // Start lock timer
      const startTime = Date.now();
      const lockDuration = 1000; // 1 second to lock

      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / lockDuration, 1);
        setLockProgress(progress);

        if (progress >= 1) {
          clearInterval(progressInterval);
        }
      }, 16);

      const timer = setTimeout(() => {
        // Lock the connection
        onConnectionLock(fromId, toId);
        
        // Clear car animation after lock
        setCarAnimation(null);
        setLockProgress(0);
        clearInterval(progressInterval);
        // Reset processing flag and pending ref after lock completes
        isProcessingConnectionRef.current = false;
        pendingConnectionRef.current = null;
      }, lockDuration);

      setLockTimer(timer);
    } else {
      // Reset if not released on valid node
      resetDrawingState();
      isProcessingConnectionRef.current = false;
      pendingConnectionRef.current = null;
    }
  };

  const handleCancel = () => {
    // Clear all timers
    if (lockTimer) {
      clearTimeout(lockTimer);
      setLockTimer(null);
    }
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
    if (hoverProgressIntervalRef.current) {
      clearInterval(hoverProgressIntervalRef.current);
      hoverProgressIntervalRef.current = null;
    }
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    // Reset all drawing state
    setLockingConnection(null);
    setCarAnimation(null);
    resetDrawingState();
  };

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (lockTimer) clearTimeout(lockTimer);
      if (hoverTimer) clearTimeout(hoverTimer);
      if (hoverProgressIntervalRef.current) clearInterval(hoverProgressIntervalRef.current);
      if (longPressTimer) clearTimeout(longPressTimer);
    };
  }, [lockTimer, hoverTimer, longPressTimer]);
  
  // Clear lockingConnection IMMEDIATELY when the connection appears in uniqueConnections
  // This prevents duplicate lines (lockingConnection + actual connection)
  // CRITICAL: Use uniqueConnections as source of truth
  useEffect(() => {
    if (lockingConnection) {
      const exists = uniqueConnections.some(
        c => (c.from === lockingConnection.from && c.to === lockingConnection.to) ||
             (c.from === lockingConnection.to && c.to === lockingConnection.from)
      );
      if (exists) {
        // Connection is now in uniqueConnections, clear the temporary locking connection IMMEDIATELY
        setLockingConnection(null);
        setLockProgress(0);
        // Also ensure isDrawing is false and clear pending ref
        setIsDrawing(false);
        setDrawCurrent(null);
        pendingConnectionRef.current = null;
      }
    }
  }, [uniqueConnections, lockingConnection]);

  // Clean up drawing state COMPLETELY when connections are cleared
  // CRITICAL: This ensures no hanging lines/arrows remain after reset
  // This runs whenever connections array becomes empty
  useEffect(() => {
    if (connections.length === 0) {
      // Clear all timers FIRST
      if (lockTimer) {
        clearTimeout(lockTimer);
        setLockTimer(null);
      }
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        setHoverTimer(null);
      }
      if (hoverProgressIntervalRef.current) {
        clearInterval(hoverProgressIntervalRef.current);
        hoverProgressIntervalRef.current = null;
      }
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
      
      // Cancel any pending animation frames IMMEDIATELY
      if (lastMoveTimeRef.current) {
        cancelAnimationFrame(lastMoveTimeRef.current);
        lastMoveTimeRef.current = 0;
      }
      
      // CRITICAL: Force remove ALL SVG children immediately to prevent ghost lines
      if (svgRef.current) {
        const svg = svgRef.current;
        // Remove all children except the AnimatePresence wrapper
        // This ensures no ghost lines remain
        while (svg.firstChild) {
          svg.removeChild(svg.firstChild);
        }
      }
      
      // Reset all drawing state COMPLETELY - this removes ALL lines
      setIsDrawing(false);
      setDrawStart(null);
      setDrawCurrent(null);
      setHoveredNode(null);
      setLockProgress(0);
      setHoverStartTime(null);
      setLockingConnection(null);
      setCarAnimation(null);
      
      // Clear all refs and flags
      isProcessingConnectionRef.current = false;
      connectionCreatedRef.current = false;
      pendingConnectionRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connections.length]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full flex items-start justify-center overflow-hidden pt-28"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handleCancel}
      onPointerLeave={handleCancel}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 flex items-start justify-center pointer-events-none pt-10">
        <div className="w-[85vw] max-w-[450px] aspect-square rounded-full border-2 border-dashed border-gray-200 opacity-50" />
        <div className="absolute w-[65vw] max-w-[320px] aspect-square rounded-full border border-gray-100" style={{ marginTop: 'calc(85vw * 0.1)' }} />
      </div>

      {/* Connection lines SVG */}
      <svg 
        ref={svgRef}
        className="absolute inset-0 w-full h-full pointer-events-none" 
        style={{ zIndex: 1 }}
        key={connections.length} // CRITICAL: Force SVG to remount when connections are cleared
      >
        <AnimatePresence mode="popLayout">
          {/* All connections (locked and unlocked) - filter out duplicates */}
          {uniqueConnections.map((conn) => {
              const fromDest = destinations.find(d => d.id === conn.from);
              const toDest = destinations.find(d => d.id === conn.to);
              if (!fromDest || !toDest) return null;

              const fromPos = getNodeScreenPosition(fromDest);
              const toPos = getNodeScreenPosition(toDest);
              
            // Apply Y-calibration offset to line endpoints (use cached value)
            const dy = lineYCalRef.current;

            return (
              <DrawingLine
                key={`connection-${conn.from}-${conn.to}`}
                from={{ x: fromPos.x, y: fromPos.y + dy }}
                to={{ x: toPos.x, y: toPos.y + dy }}
                color={toDest.color}
                isLocked={conn.isLocked}
              />
            );
            })}

          {/* Locking connection - ONLY show during lock animation, NEVER when connection exists */}
          {/* CRITICAL: This should ONLY render during the 1-second lock period, then disappear */}
          {lockingConnection && !isDrawing && !drawCurrent && 
           !uniqueConnections.some(
             c => (c.from === lockingConnection.from && c.to === lockingConnection.to) ||
                  (c.from === lockingConnection.to && c.to === lockingConnection.from)
           ) && lockProgress > 0 && (
            (() => {
              const fromDest = destinations.find(d => d.id === lockingConnection.from);
              const toDest = destinations.find(d => d.id === lockingConnection.to);
              if (!fromDest || !toDest) return null;

              const fromPos = getNodeScreenPosition(fromDest);
              const toPos = getNodeScreenPosition(toDest);
              
              // Apply Y-calibration offset to line endpoints (use cached value)
              const dy = lineYCalRef.current;

              return (
                <DrawingLine
                  key="locking"
                  from={{ x: fromPos.x, y: fromPos.y + dy }}
                  to={{ x: toPos.x, y: toPos.y + dy }}
                  color={toDest.color}
                  isLocked={false}
                  lockProgress={lockProgress}
                />
              );
            })()
          )}

          {/* Active drawing line - only show when actively drawing and NOT locked */}
          {/* CRITICAL: Only render if isDrawing is true AND lockingConnection is null AND connection doesn't exist AND not pending */}
          {isDrawing && drawStart && drawCurrent && !lockingConnection && 
           !pendingConnectionRef.current &&
           !uniqueConnections.some(
             c => (c.from === drawStart.id && c.to === hoveredNode) ||
                  (c.from === hoveredNode && c.to === drawStart.id)
           ) && (
            <motion.g>
              <motion.line
                x1={drawStart.x}
                y1={drawStart.y}
                x2={drawCurrent.x}
                y2={drawCurrent.y}
                stroke={hoveredNode 
                  ? destinations.find(d => d.id === hoveredNode)?.color || '#3B82F6' 
                  : '#94A3B8'
                }
                strokeWidth="4"
                strokeLinecap="round"
                opacity={0.8}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
              />
              {/* Arrow at the end - dynamically rotated */}
              {(() => {
                // Calculate angle from drawStart to drawCurrent
                const angle = Math.atan2(drawCurrent.y - drawStart.y, drawCurrent.x - drawStart.x);
                const ARROW_LENGTH = 10;
                const ARROW_ANGLE = Math.PI / 6; // 30 degrees
                
                // Calculate arrow points
                const arrowX1 = drawCurrent.x - ARROW_LENGTH * Math.cos(angle - ARROW_ANGLE);
                const arrowY1 = drawCurrent.y - ARROW_LENGTH * Math.sin(angle - ARROW_ANGLE);
                const arrowX2 = drawCurrent.x - ARROW_LENGTH * Math.cos(angle + ARROW_ANGLE);
                const arrowY2 = drawCurrent.y - ARROW_LENGTH * Math.sin(angle + ARROW_ANGLE);
                
                const hoveredColor = hoveredNode 
                  ? destinations.find(d => d.id === hoveredNode)?.color || '#3B82F6' 
                  : '#94A3B8';
                
                return (
                  <motion.path
                    d={`M ${drawCurrent.x} ${drawCurrent.y} 
                        L ${arrowX1} ${arrowY1} 
                        M ${drawCurrent.x} ${drawCurrent.y} 
                        L ${arrowX2} ${arrowY2}`}
                    stroke={hoveredColor}
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity={0.8}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                  />
                );
              })()}
            </motion.g>
          )}
          
          {/* Car animation on route */}
          {carAnimation && (() => {
            const fromDest = destinations.find(d => d.id === carAnimation.from);
            const toDest = destinations.find(d => d.id === carAnimation.to);
            if (!fromDest || !toDest) return null;

            const fromPos = getNodeScreenPosition(fromDest);
            const toPos = getNodeScreenPosition(toDest);
            
            // Calculate angle for car rotation
            const angle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x) * (180 / Math.PI);

            return (
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Car icon */}
                <motion.text
                  fontSize="24"
                  initial={{ 
                    x: fromPos.x,
                    y: fromPos.y,
                  }}
                  animate={{ 
                    x: toPos.x,
                    y: toPos.y,
                  }}
                  transition={{ 
                    duration: 1,
                    ease: "easeInOut"
                  }}
                  style={{
                    transform: `rotate(${angle}deg)`,
                    transformOrigin: 'center',
                  }}
                >
                  🚗
                </motion.text>
              </motion.g>
            );
          })()}
        </AnimatePresence>
      </svg>

      {/* Navigation wheel */}
      <div ref={wheelContainerRef} className="relative pt-28" style={{ zIndex: 10 }}>
        {/* Center node */}
        {centerNode && (
          <div 
            className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ 
              top: 'calc(112px + (100% - 112px) / 2)'
            }}
          >
            <DestinationNode
              destination={centerNode}
              isSelected={drawStart?.id === centerNode.id}
              isHovered={hoveredNode === centerNode.id}
              onPointerDown={(e) => handlePointerDown(e, centerNode.id)}
              onContextMenu={(e) => handleContextMenu(e, centerNode.id)}
              isCenter={true}
              isDrawable={canNodeStartDrawing(centerNode.id).allowed}
              lockProgress={hoveredNode === centerNode.id ? lockProgress : 0}
              isEditMode={isEditMode}
            />
          </div>
        )}

        {/* Surrounding nodes */}
        <AnimatePresence mode="popLayout">
          {otherNodes.map(dest => {
            // Always use computed angle for defined positions
            // In edit mode, we swap positions but still use computed angles
            const angle = computedAngles.get(dest.id) ?? dest.position.angle;
            const pos = getNodePosition(angle, dest.position.radius);
            
            // Check if this node is part of a swap animation
            const isSwapping = swapAnimation && (
              swapAnimation.from === dest.id || 
              swapAnimation.to === dest.id
            );
            const isInRoute = connections
              .filter(c => c.isLocked)
              .some(c => c.from === dest.id || c.to === dest.id);
            
            // Check if this is an empty node and we've reached max
            const isDisabled = (dest.isEmpty || dest.label === 'Legg til sted') && hasReachedMax;
            const isDeleting = deletingNodeId === dest.id;

            // Check if this node is being dragged
            const isDragging = isEditMode && draggingNodeId === dest.id;
            const dragOffset = isDragging && dragCurrentPos && dragStartPos
              ? { x: dragCurrentPos.x - dragStartPos.x, y: dragCurrentPos.y - dragStartPos.y }
              : { x: 0, y: 0 };
            
            return (
              <motion.div
                key={dest.id}
                className="absolute left-1/2 top-0"
                style={{
                  x: pos.x - 40 + dragOffset.x,
                  y: pos.y - 40 + 112 + dragOffset.y, // Add offset to match new center position (pt-28 = 112px)
                  zIndex: isDragging ? 1000 : 1, // Bring dragging node to front
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: isSwapping ? 1.2 : (isDragging ? 1.15 : 1), 
                  opacity: isDragging ? 0.9 : 1,
                }}
                exit={{ 
                  scale: 0,
                  opacity: 0,
                }}
                transition={{ 
                  type: isDragging ? 'tween' : 'spring', 
                  stiffness: 260, 
                  damping: 20,
                  duration: isDragging ? 0 : undefined,
                  exit: {
                    duration: 0.4,
                    ease: "easeIn"
                  }
                }}
              >
                <DestinationNode
                  destination={dest}
                  isSelected={
                    drawStart?.id === dest.id || 
                    isInRoute || 
                    (isEditMode && hoveredSwapNodeId === dest.id) ||
                    (isEditMode && draggingNodeId === dest.id)
                  }
                  isHovered={
                    hoveredNode === dest.id || 
                    (isEditMode && hoveredSwapNodeId === dest.id) ||
                    (isEditMode && draggingNodeId === dest.id)
                  }
                  onPointerDown={(e) => handlePointerDown(e, dest.id)}
                  onContextMenu={(e) => handleContextMenu(e, dest.id)}
                  isDrawable={canNodeStartDrawing(dest.id).allowed && !isDisabled}
                  lockProgress={hoveredNode === dest.id ? lockProgress : 0}
                  isDisabled={isDisabled}
                  isDeleting={isDeleting}
                  isEditMode={isEditMode}
                  onDeleteClick={(e) => {
                    e.stopPropagation();
                    if (onNodeDelete) {
                      onNodeDelete(dest.id);
                    }
                  }}
                />
                
                {/* Swap indicator - shows when hovering over a node to swap */}
                {isEditMode && hoveredSwapNodeId === dest.id && draggingNodeId && draggingNodeId !== dest.id && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-blue-500 pointer-events-none"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 300, 
                      damping: 20,
                      repeat: Infinity,
                      repeatType: 'reverse'
                    }}
                    style={{
                      boxShadow: '0 0 20px rgba(59, 130, 246, 0.6)',
                    }}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Edit mode instruction box */}
      {isEditMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-8 left-1/2 -translate-x-1/2 bg-orange-100 border-2 border-orange-300 rounded-xl px-3 py-1.5 shadow-lg z-50"
        >
          <p className="text-orange-800 text-xs font-medium">
            Dra node over en annen for plass bytte. Trykk X for å slette
          </p>
        </motion.div>
      )}

      {/* Hint text - simple version - moved to top */}
      {!isEditMode && connections.length === 0 && !isDrawing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-8 left-1/2 -translate-x-1/2 text-center"
        >
          <p className="text-gray-500 text-sm">Trekk linje fra din posisjon, til der du vil</p>
        </motion.div>
      )}


      {/* Progress hint - shows after first connection - moved to top */}
        {connections.length > 0 && connections.length < 4 && !isDrawing && !lockingConnection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-8 left-1/2 -translate-x-1/2 text-center"
          >
            <p className="text-green-600 font-medium text-sm">✓ Legg til flere, eller trykk «Vis reiseplan»</p>
          </motion.div>
        )}

      {/* Edit button - bottom left - only show when no route is selected, no line is being drawn, and no line is active/recently drawn */}
      <AnimatePresence>
        {onEditModeToggle && 
         !isDrawing && 
         !lockingConnection && 
         connections.length === 0 && 
         !carAnimation && (
          <EditButton isEditMode={isEditMode} onToggle={onEditModeToggle} />
        )}
      </AnimatePresence>
    </div>
  );
}

interface EditButtonProps {
  isEditMode: boolean;
  onToggle: () => void;
}

const EditButton = React.memo(function EditButton({ isEditMode, onToggle }: EditButtonProps) {
  const buttonClassName = isEditMode 
    ? 'bg-orange-500 hover:bg-orange-600 text-white' 
    : 'bg-white hover:bg-gray-50 text-gray-800 border-2 border-pink-200';
  
  return (
    <motion.button
      onClick={onToggle}
      className={`fixed bottom-6 left-4 px-4 py-2 rounded-full flex items-center gap-2 font-medium transition-colors backdrop-blur-sm shadow-lg z-50 ${buttonClassName}`}
      whileTap={{ scale: 0.95 }}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {isEditMode ? (
        <>
          <Check className="w-4 h-4" />
          <span>Done</span>
        </>
      ) : (
        <>
          <Edit className="w-4 h-4" />
          <span>Edit</span>
        </>
      )}
    </motion.button>
  );
});
