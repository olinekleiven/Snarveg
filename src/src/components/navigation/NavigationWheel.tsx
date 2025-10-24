import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DestinationNode from './DestinationNode';
import DrawingLine from './DrawingLine';
import { Destination, Connection } from '../../types';
import { toast } from 'sonner';

interface NavigationWheelProps {
  destinations: Destination[];
  connections: Connection[];
  onConnectionCreate: (from: string, to: string) => void;
  onConnectionLock: (from: string, to: string) => void;
  onNodeClick?: (destination: Destination) => void;
}

export default function NavigationWheel({
  destinations,
  connections,
  onConnectionCreate,
  onConnectionLock,
  onNodeClick,
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

  const centerNode = destinations.find(d => d.isCenter);
  const otherNodes = destinations.filter(d => !d.isCenter);

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
    
    const pos = getNodePosition(dest.position.angle, dest.position.radius);
    return {
      x: centerX + pos.x,
      y: centerY + pos.y,
    };
  };

  const handlePointerDown = (e: React.PointerEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Store initial position for click detection
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setPointerStartPos({ x: e.clientX, y: e.clientY });
      setPointerDownNodeId(nodeId);
    }
    
    // Start long-press timer (700ms) to open edit modal
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
    
    const dest = destinations.find(d => d.id === nodeId);
    if (!dest) return;

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
    
    if (!isDrawing || !containerRef.current || !drawStart) return;

    const rect = containerRef.current.getBoundingClientRect();
    setDrawCurrent({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    // Check if hovering over a node
    const hoveredDest = destinations.find(dest => {
      if (dest.id === drawStart.id) return false;
      
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

    if (!isDrawing || !drawStart) {
      setIsDrawing(false);
      setDrawStart(null);
      setDrawCurrent(null);
      setHoveredNode(null);
      setLockProgress(0);
      setHoverStartTime(null);
      return;
    }

    // Check if released on a valid node (manual release before auto-lock)
    if (hoveredNode && hoveredNode !== drawStart.id) {
      // Create connection
      onConnectionCreate(drawStart.id, hoveredNode);
      
      // Start car animation
      setCarAnimation({ from: drawStart.id, to: hoveredNode });
      
      setLockingConnection({ from: drawStart.id, to: hoveredNode });

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
        
        // Stop drawing - user must explicitly start a new drag from the next node
        setIsDrawing(false);
        setDrawStart(null);
        setDrawCurrent(null);

        setLockingConnection(null);
        setLockProgress(0);
        clearInterval(progressInterval);
      }, lockDuration);

      setLockTimer(timer);
    } else {
      // Reset if not released on valid node
      setIsDrawing(false);
      setDrawStart(null);
      setDrawCurrent(null);
      setHoveredNode(null);
      setLockProgress(0);
      setHoverStartTime(null);
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
    setDrawStart(null);
    setDrawCurrent(null);
    setHoveredNode(null);
    setLockProgress(0);
    setHoverStartTime(null);
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
          {isDrawing && drawStart && drawCurrent && !lockingConnection && (
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
              {/* Arrow at the end */}
              <motion.path
                d={`M ${drawCurrent.x} ${drawCurrent.y} 
                    L ${drawCurrent.x - 10} ${drawCurrent.y - 10} 
                    M ${drawCurrent.x} ${drawCurrent.y} 
                    L ${drawCurrent.x - 10} ${drawCurrent.y + 10}`}
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
          })()

}
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
            />
          </div>
        )}

        {/* Surrounding nodes */}
        {otherNodes.map(dest => {
          const pos = getNodePosition(dest.position.angle, dest.position.radius);
          const isInRoute = connections
            .filter(c => c.isLocked)
            .some(c => c.from === dest.id || c.to === dest.id);

          return (
            <motion.div
              key={dest.id}
              className="absolute left-1/2 top-1/2"
              style={{
                x: pos.x - 40,
                y: pos.y - 40,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              <DestinationNode
                destination={dest}
                isSelected={drawStart?.id === dest.id || isInRoute}
                isHovered={hoveredNode === dest.id}
                onPointerDown={(e) => handlePointerDown(e, dest.id)}
                onContextMenu={(e) => handleContextMenu(e, dest.id)}
                isDrawable={canNodeStartDrawing(dest.id).allowed}
                lockProgress={hoveredNode === dest.id ? lockProgress : 0}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Hint text - simple version - moved to top */}
      {connections.length === 0 && !isDrawing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-24 left-1/2 -translate-x-1/2 text-center"
        >
          <p className="text-gray-500 text-sm">Trekk frå <span className="font-medium">Min posisjon</span> til første stad</p>
          <p className="text-gray-400 text-xs mt-1">Slepp eller hold inne for å låse</p>
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
    </div>
  );
}
