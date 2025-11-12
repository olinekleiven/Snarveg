import React, { useRef, useState, useEffect, useMemo } from 'react';
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
  onNodeMove?: (nodeId: string, newPosition: { angle: number; radius: number }) => void; // Callback when node is moved
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
  onNodeMove,
  onNodeSwap,
  onNodeDelete,
  onEditModeToggle,
}: NavigationWheelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ id: string; x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [lockTimer, setLockTimer] = useState<NodeJS.Timeout | null>(null);
  const [lockingConnection, setLockingConnection] = useState<{ from: string; to: string } | null>(null);
  const [lockProgress, setLockProgress] = useState(0);
  const [carAnimation, setCarAnimation] = useState<{ from: string; to: string } | null>(null);
  const [lastTapTime, setLastTapTime] = useState<number>(0);
  const [lastTapId, setLastTapId] = useState<string>('');
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
  const [hoverStartTime, setHoverStartTime] = useState<number | null>(null);
  const hoverProgressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [longPressNodeId, setLongPressNodeId] = useState<string | null>(null);
  const [pointerStartPos, setPointerStartPos] = useState<{ x: number; y: number } | null>(null);
  const [pointerDownNodeId, setPointerDownNodeId] = useState<string | null>(null);
  const [chainedDrawing, setChainedDrawing] = useState(false);
  const [chainedFromNode, setChainedFromNode] = useState<string | null>(null);
  const currentMousePosRef = useRef<{ x: number; y: number } | null>(null);
  
  // Edit mode state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [dragStartAngle, setDragStartAngle] = useState<number | null>(null);
  const [hoveredSwapNodeId, setHoveredSwapNodeId] = useState<string | null>(null);
  const [swapAnimation, setSwapAnimation] = useState<{ from: string; to: string } | null>(null);

  const centerNode = destinations.find(d => d.isCenter);
  const otherNodes = destinations.filter(d => !d.isCenter);

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
  const filledNodes = otherNodes.filter(d => !d.isEmpty);
  const hasReachedMax = filledNodes.length >= maxDestinations;

  const getNodePosition = (angle: number, radius: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: Math.cos(rad) * radius,
      y: Math.sin(rad) * radius,
    };
  };

  const getNodeScreenPosition = (dest: Destination) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    if (dest.isCenter) {
      return { x: centerX, y: centerY };
    }
  // Use computed angle when available so nodes are evenly spaced.
  const angle = computedAngles.get(dest.id) ?? dest.position.angle;
  const pos = getNodePosition(angle, dest.position.radius);
    return {
      x: centerX + pos.x,
      y: centerY + pos.y,
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
        setDraggingNodeId(nodeId);
        setDragStartPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
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

    const pos = getNodeScreenPosition(dest);
    setIsDrawing(true);
    setDrawStart({ id: nodeId, x: pos.x, y: pos.y });
    setDrawCurrent({ x: pos.x, y: pos.y });
  };

  // Helper function to check if a node can start a drawing
  const canNodeStartDrawing = (nodeId: string): { allowed: boolean; message?: string } => {
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
  };

  const handleContextMenu = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const destination = destinations.find(d => d.id === nodeId);
    if (destination && onNodeClick) {
      onNodeClick(destination);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // Handle drag-and-drop in edit mode - only allow swapping, not free movement
    if (isEditMode && draggingNodeId && dragStartPos && dragStartAngle !== null && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Check if hovering over another node to swap positions
      const hoveredDest = otherNodes.find(dest => {
        if (dest.id === draggingNodeId || dest.isCenter || dest.isEmpty || dest.label === 'Legg til sted') {
          return false;
        }
        // Use computed angle to find the node's defined position
        const angle = computedAngles.get(dest.id) ?? dest.position.angle;
        const pos = getNodePosition(angle, dest.position.radius);
        const nodeScreenX = centerX + pos.x;
        const nodeScreenY = centerY + pos.y;
        
        const dx = mouseX - nodeScreenX;
        const dy = mouseY - nodeScreenY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < 50; // 50px hit radius
      });
      
      if (hoveredDest) {
        setHoveredSwapNodeId(hoveredDest.id);
      } else {
        setHoveredSwapNodeId(null);
      }
      // Don't allow free movement - only swapping is allowed
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
    
    if ((!isDrawing && !chainedDrawing) || !containerRef.current || !drawStart) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mousePos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    
    // Store current mouse position for chained drawing
    currentMousePosRef.current = mousePos;
    
    setDrawCurrent(mousePos);

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

      // Auto-lock timer
      const timer = setTimeout(() => {
        // Auto-lock the connection
        if (newHoveredNode && drawStart) {
          // Create connection
          onConnectionCreate(drawStart.id, newHoveredNode);
          
          // Lock it immediately
          onConnectionLock(drawStart.id, newHoveredNode);

          // Show car animation
          setCarAnimation({ from: drawStart.id, to: newHoveredNode });
          setTimeout(() => setCarAnimation(null), 1000);

          // Stop drawing - user must explicitly start a new drag from the next node
          setIsDrawing(false);
          setDrawStart(null);
          setDrawCurrent(null);
          setHoveredNode(null);
          setLockProgress(0);
          setHoverStartTime(null);

          toast.success(`${destinations.find(d => d.id === newHoveredNode)?.label} lagt til!`, {
            duration: 1500,
            style: {
              background: '#10B981',
              color: '#FFFFFF',
              border: 'none',
            },
          });
        }
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

    if ((!isDrawing && !chainedDrawing) || !drawStart) {
      setIsDrawing(false);
      setChainedDrawing(false);
      setChainedFromNode(null);
      setDrawStart(null);
      setDrawCurrent(null);
      setHoveredNode(null);
      setLockProgress(0);
      setHoverStartTime(null);
      currentMousePosRef.current = null;
      return;
    }

    // Check if released on a valid node (manual release before auto-lock)
    if (hoveredNode && hoveredNode !== drawStart.id) {
      // Create connection
      onConnectionCreate(drawStart.id, hoveredNode);
      
      // Start car animation
      setCarAnimation({ from: drawStart.id, to: hoveredNode });
      
      setLockingConnection({ from: drawStart.id, to: hoveredNode });
      
      // If this is chained drawing, stop it and start regular drawing
      if (chainedDrawing) {
        setChainedDrawing(false);
        setChainedFromNode(null);
      }

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
        onConnectionLock(drawStart.id, hoveredNode);
        
        // Clear car animation after lock
        setCarAnimation(null);
        
        // Enable chained drawing - continue from the target node
        setChainedDrawing(true);
        setChainedFromNode(hoveredNode);
        
        // Update drawStart to the target node position
        const targetNodePos = getNodeScreenPosition(destinations.find(d => d.id === hoveredNode)!);
        setDrawStart({ id: hoveredNode, ...targetNodePos });
        
        // Keep drawCurrent at mouse position for immediate continuation
        if (currentMousePosRef.current) {
          setDrawCurrent(currentMousePosRef.current);
        } else {
          setDrawCurrent(targetNodePos);
        }

        setLockingConnection(null);
        setLockProgress(0);
        clearInterval(progressInterval);
      }, lockDuration);

      setLockTimer(timer);
    } else {
      // Reset if not released on valid node
      setIsDrawing(false);
      setChainedDrawing(false);
      setChainedFromNode(null);
      setDrawStart(null);
      setDrawCurrent(null);
      setHoveredNode(null);
      setLockProgress(0);
      setHoverStartTime(null);
      currentMousePosRef.current = null;
    }
  };

  const handleCancel = () => {
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
    
    setLockingConnection(null);
    setCarAnimation(null);
    setIsDrawing(false);
    setChainedDrawing(false);
    setChainedFromNode(null);
    setDrawStart(null);
    setDrawCurrent(null);
    setHoveredNode(null);
    setLockProgress(0);
    setHoverStartTime(null);
    currentMousePosRef.current = null;
  };

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (lockTimer) clearTimeout(lockTimer);
      if (hoverTimer) clearTimeout(hoverTimer);
      if (hoverProgressIntervalRef.current) clearInterval(hoverProgressIntervalRef.current);
    };
  }, [lockTimer, hoverTimer]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handleCancel}
      onPointerLeave={handleCancel}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[80vw] max-w-[400px] aspect-square rounded-full border-2 border-dashed border-gray-200 opacity-50" />
        <div className="absolute w-[60vw] max-w-[280px] aspect-square rounded-full border border-gray-100" />
      </div>

      {/* Connection lines SVG */}
      <svg 
        ref={svgRef}
        className="absolute inset-0 w-full h-full pointer-events-none" 
        style={{ zIndex: 1 }}
      >
        <AnimatePresence>
          {/* All connections (locked and unlocked) */}
          {connections.map((conn, idx) => {
            const fromDest = destinations.find(d => d.id === conn.from);
            const toDest = destinations.find(d => d.id === conn.to);
            if (!fromDest || !toDest) return null;

            const fromPos = getNodeScreenPosition(fromDest);
            const toPos = getNodeScreenPosition(toDest);

            return (
              <DrawingLine
                key={`connection-${conn.from}-${conn.to}-${idx}`}
                from={fromPos}
                to={toPos}
                color={toDest.color}
                isLocked={conn.isLocked}
              />
            );
          })}

          {/* Locking connection */}
          {lockingConnection && (
            (() => {
              const fromDest = destinations.find(d => d.id === lockingConnection.from);
              const toDest = destinations.find(d => d.id === lockingConnection.to);
              if (!fromDest || !toDest) return null;

              const fromPos = getNodeScreenPosition(fromDest);
              const toPos = getNodeScreenPosition(toDest);

              return (
                <DrawingLine
                  key="locking"
                  from={fromPos}
                  to={toPos}
                  color={toDest.color}
                  isLocked={false}
                  lockProgress={lockProgress}
                />
              );
            })()
          )}

          {/* Active drawing line */}
          {(isDrawing || chainedDrawing) && drawStart && drawCurrent && !lockingConnection && (
            <motion.g>
              <motion.line
                x1={drawStart.x}
                y1={drawStart.y}
                x2={drawCurrent.x}
                y2={drawCurrent.y}
                stroke={hoveredNode ? 
                  destinations.find(d => d.id === hoveredNode)?.color || '#3B82F6' 
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
                const arrowLength = 10;
                const arrowAngle = Math.PI / 6; // 30 degrees
                
                // Calculate arrow points
                const arrowX1 = drawCurrent.x - arrowLength * Math.cos(angle - arrowAngle);
                const arrowY1 = drawCurrent.y - arrowLength * Math.sin(angle - arrowAngle);
                const arrowX2 = drawCurrent.x - arrowLength * Math.cos(angle + arrowAngle);
                const arrowY2 = drawCurrent.y - arrowLength * Math.sin(angle + arrowAngle);
                
                return (
                  <motion.path
                    d={`M ${drawCurrent.x} ${drawCurrent.y} 
                        L ${arrowX1} ${arrowY1} 
                        M ${drawCurrent.x} ${drawCurrent.y} 
                        L ${arrowX2} ${arrowY2}`}
                    stroke={hoveredNode ? 
                      destinations.find(d => d.id === hoveredNode)?.color || '#3B82F6' 
                      : '#94A3B8'
                    }
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
          
          {/* Chained drawing indicator */}
          {chainedDrawing && chainedFromNode && (
            <motion.text
              x={getNodeScreenPosition(destinations.find(d => d.id === chainedFromNode)!).x}
              y={getNodeScreenPosition(destinations.find(d => d.id === chainedFromNode)!).y - 30}
              textAnchor="middle"
              className="text-xs font-medium fill-blue-600"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              Fortsett å tegne...
            </motion.text>
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
      <div className="relative" style={{ zIndex: 10 }}>
        {/* Center node */}
        {centerNode && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
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

            return (
              <motion.div
                key={dest.id}
                className="absolute left-1/2 top-1/2"
                style={{
                  x: pos.x - 40,
                  y: pos.y - 40,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: isSwapping ? 1.2 : 1, 
                  opacity: 1,
                }}
                exit={{ 
                  scale: 0,
                  opacity: 0,
                }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 260, 
                  damping: 20,
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
          className="absolute top-24 left-1/2 -translate-x-1/2 bg-orange-100 border-2 border-orange-300 rounded-xl px-4 py-2 shadow-lg z-50"
        >
          <p className="text-orange-800 text-sm font-medium">
            Edit Mode: Drag to reorder, click X to delete
          </p>
        </motion.div>
      )}

      {/* Hint text - simple version - moved to top */}
      {!isEditMode && connections.length === 0 && !isDrawing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-24 left-1/2 -translate-x-1/2 text-center"
        >
          <p className="text-gray-500 text-sm">Trekk linje fra din posisjon, til der du vil</p>
        </motion.div>
      )}

      {/* Lock instruction */}
      {lockingConnection && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-24 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-6 py-3 rounded-full shadow-lg text-sm z-50"
        >
          Hold for å låse ({Math.ceil((1 - lockProgress))}s)
        </motion.div>
      )}

      {/* Progress hint - shows after first connection - moved to top */}
      {connections.length > 0 && connections.length < 4 && !isDrawing && !lockingConnection && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute top-24 left-1/2 -translate-x-1/2 text-center"
        >
          <p className="text-green-600 font-medium text-sm">✓ Legg til flere, eller trykk «Vis reiseplan»</p>
        </motion.div>
      )}

      {/* Edit button - bottom left - only show when no route is selected, no line is being drawn, and no line is active/recently drawn */}
      <AnimatePresence>
        {onEditModeToggle && 
         !isDrawing && 
         !chainedDrawing && 
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

function EditButton({ isEditMode, onToggle }: EditButtonProps) {
  return (
    <motion.button
      onClick={onToggle}
      className={`fixed bottom-6 left-4 px-4 py-2 rounded-full flex items-center gap-2 font-medium transition-colors backdrop-blur-sm shadow-lg z-50 ${
        isEditMode 
          ? 'bg-orange-500 hover:bg-orange-600 text-white' 
          : 'bg-white hover:bg-gray-50 text-gray-800 border-2 border-pink-200'
      }`}
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
}
