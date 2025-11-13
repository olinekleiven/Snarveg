import { useState, useEffect } from 'react';
import TopBar from './components/travel/TopBar';
import NavigationWheel from './components/travel/NavigationWheel';
import EditDestinationModal from './components/travel/EditDestinationModal';
import SelectLocationModal from './components/travel/SelectLocationModal';
import RouteVisualization from './components/travel/RouteVisualization';
import OnboardingFlow, { UserPreferences } from './components/travel/OnboardingFlow';
import SettingsModal from './components/travel/SettingsModal';
import TicketButton from './components/travel/TicketButton';
import TicketOverview from './components/travel/TicketOverview';
import AnimatedBackground from './components/travel/AnimatedBackground';
import { Destination, Route, Connection } from './components/travel/types';
import { INITIAL_DESTINATIONS, STORAGE_KEYS } from './utils/constants';
import { 
  buildRouteFromConnections, 
  getRandomTransportMode,
  connectionExists,
  hasOutgoingConnection,
  rebuildConnectionsFromOrder,
  checkActiveTicket,
  recalculateNodePositions
} from './utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  // Check localStorage immediately for initial state
  const initialOnboardingState = false; // Force show onboarding
  const initialPreferences = localStorage.getItem(STORAGE_KEYS.PREFERENCES) 
    ? JSON.parse(localStorage.getItem(STORAGE_KEYS.PREFERENCES) || 'null')
    : null;

  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(initialOnboardingState);
  const [userPreferences, setUserPreferences] = useState(initialPreferences);
  const [destinations, setDestinations] = useState(INITIAL_DESTINATIONS);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSelectLocationOpen, setIsSelectLocationOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTicketOverviewOpen, setIsTicketOverviewOpen] = useState(false);
  const [editingDestination, setEditingDestination] = useState<Destination | null>(null);
  const [viewMode, setViewMode] = useState<'wheel' | 'route'>('wheel');
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [hasActiveTicket, setHasActiveTicket] = useState(false);
  const [deletingNodeId, setDeletingNodeId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Maximum number of destinations (excluding center)
  const MAX_DESTINATIONS = 20;
  
  // Helper function to create empty node
  const createEmptyNode = (): Destination => ({
    id: `empty-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    emoji: '+',
    label: 'Legg til sted',
    color: '#E5E7EB',
    position: { angle: 0, radius: 140 },
    isEmpty: true,
  });

  // Check if user has completed onboarding
  useEffect(() => {
    const savedPreferences = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    
    if (savedPreferences) {
      setUserPreferences(JSON.parse(savedPreferences));
    }
    
    // DON'T check onboardingComplete - always show onboarding!
    // Commented out to force onboarding every time:
    // const onboardingComplete = localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
    // if (onboardingComplete === 'true' && savedPreferences) {
    //   setHasCompletedOnboarding(true);
    //   setUserPreferences(JSON.parse(savedPreferences));
    // }

    // Check for active ticket
    const checkTicket = () => {
      setHasActiveTicket(checkActiveTicket());
    };
    
    checkTicket();
    // Check every minute
    const interval = setInterval(checkTicket, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleOnboardingComplete = (preferences: UserPreferences) => {
    setUserPreferences(preferences);
    setHasCompletedOnboarding(true);
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
    
    console.log('User preferences:', preferences);
  };

  const handleSavePreferences = (preferences: UserPreferences) => {
    setUserPreferences(preferences);
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
  };

  const handlePurchaseTicket = (_ticketType: string, _duration: number, _price: number) => {
    setHasActiveTicket(true);
    // Modal will close automatically after purchase
  };

  const handleConnectionCreate = (from: string, to: string) => {
    setConnections(prev => {
      // First, remove any duplicates that might have snuck in (defensive programming)
      // Check BOTH directions to prevent duplicates
      const seen = new Set<string>();
      const deduplicated = prev.filter(conn => {
        const key = `${conn.from}-${conn.to}`;
        const reverseKey = `${conn.to}-${conn.from}`;
        if (seen.has(key) || seen.has(reverseKey)) {
          return false; // Duplicate found (either direction)
        }
        seen.add(key);
        seen.add(reverseKey);
        return true;
      });

      // Check if connection already exists in BOTH directions (after deduplication)
      const existsForward = connectionExists(deduplicated, from, to);
      const existsReverse = connectionExists(deduplicated, to, from);
      if (existsForward || existsReverse) {
        return deduplicated; // Return deduplicated array
      }

      // Check if the FROM node already has an outgoing connection
      if (hasOutgoingConnection(deduplicated, from)) {
        return deduplicated; // Return deduplicated array
      }

      const randomTransport = getRandomTransportMode();
      return [...deduplicated, { 
        from, 
        to, 
        isLocked: false,
        transportMode: randomTransport,
        createdAt: Date.now()
      }];
    });
  };

  const handleConnectionLock = (from: string, to: string) => {
    setConnections(prev =>
      prev.map(c =>
        (c.from === from && c.to === to) || (c.from === to && c.to === from)
          ? { ...c, isLocked: true }
          : c
      )
    );
  };

  const handleEditDestination = (destination: Destination) => {
    setDestinations(prev => {
      // Check if this was an empty "+" node being filled
      const wasEmpty = prev.find(d => d.id === destination.id)?.isEmpty;
      
      // Update the destination
      let updated = prev.map(d => d.id === destination.id ? {
        ...destination,
        isEmpty: false, // Remove empty flag when destination is filled
      } : d);
      
      // If we filled an empty node, check if we need to add a new "+" node
      if (wasEmpty) {
        const otherNodes = updated.filter(d => !d.isCenter);
        const filledNodes = otherNodes.filter(d => !d.isEmpty);
        const hasEmptyNode = otherNodes.some(d => d.isEmpty);
        
        // Only add a new "+" node if we haven't reached the maximum (count only filled nodes)
        if (!hasEmptyNode && filledNodes.length < MAX_DESTINATIONS) {
          updated = [...updated, createEmptyNode()];
        }
      }
      
      // Remove any empty nodes if we've reached the maximum
      const otherNodesAfter = updated.filter(d => !d.isCenter);
      const filledNodesAfter = otherNodesAfter.filter(d => !d.isEmpty);
      if (filledNodesAfter.length >= MAX_DESTINATIONS) {
        // Remove all empty nodes when max is reached
        updated = updated.filter(d => d.isCenter || !d.isEmpty);
      }
      
      // Recalculate positions for all nodes to be evenly distributed
      updated = recalculateNodePositions(updated);
      
      return updated;
    });
  };

  const handleClearNode = (destinationId: string) => {
    setDestinations(prev => {
      // Reset node to empty state
      let updated = prev.map(d => 
        d.id === destinationId 
          ? { ...d, label: 'Legg til sted', emoji: '+', color: '#E5E7EB', address: undefined, coordinates: undefined, notes: undefined, isEmpty: true }
          : d
      );
      
      // Recalculate positions for all nodes to be evenly distributed
      updated = recalculateNodePositions(updated);
      
      return updated;
    });
    // Remove any connections involving this node
    setConnections(prev => prev.filter(c => c.from !== destinationId && c.to !== destinationId));
  };

  const handleDeleteDestination = (destinationId: string) => {
    // Don't allow deleting center node
    const nodeToDelete = destinations.find(d => d.id === destinationId);
    if (!nodeToDelete || nodeToDelete.isCenter) return;
    
    // Mark node for deletion (triggers visual feedback)
    setDeletingNodeId(destinationId);
    
    // Remove any connections involving this node immediately
    setConnections(prev => prev.filter(c => c.from !== destinationId && c.to !== destinationId));
    
    // Wait for animation to complete before removing the node
    setTimeout(() => {
      setDestinations(prev => {
        // Remove the node
        let updated = prev.filter(d => d.id !== destinationId);
        
        // Get other nodes (excluding center)
        const otherNodes = updated.filter(d => !d.isCenter);
        const filledNodes = otherNodes.filter(d => !d.isEmpty);
        const hasEmptyNode = otherNodes.some(d => d.isEmpty);
        
        // If we deleted the last node, ensure at least one "+" node exists
        if (otherNodes.length === 0) {
          updated = [...updated, createEmptyNode()];
        } 
        // If we're under max and don't have an empty node, add one
        else if (filledNodes.length < MAX_DESTINATIONS && !hasEmptyNode) {
          updated = [...updated, createEmptyNode()];
        }
        
        // Recalculate positions for all nodes to be evenly distributed
        updated = recalculateNodePositions(updated);
        
        return updated;
      });
      
      // Clear deleting state
      setDeletingNodeId(null);
    }, 500); // Animation duration
  };

  const handleNodeClick = (destination: Destination) => {
    setEditingDestination(destination);
    if (destination.isEmpty || destination.label === 'Legg til sted') {
      // Start at select-location step for empty nodes
      setIsSelectLocationOpen(true);
      return;
    }
    setIsEditModalOpen(true);
  };

  const handleBuildRoute = () => {
    const newRoute = buildRouteFromConnections(connections);
    if (newRoute) {
      setCurrentRoute(newRoute);
      setViewMode('route');
    }
  };

  const handleBackToWheel = () => {
    setViewMode('wheel');
    setCurrentRoute(null);
    // Keep connections so user can continue building the route
  };

  const handleClearConnections = () => {
    setConnections([]);
  };

  const handleReorderRoute = (newOrder: string[]) => {
    if (!currentRoute) return;
    
    const updatedRoute: Route = {
      ...currentRoute,
      destinations: newOrder,
    };
    setCurrentRoute(updatedRoute);

    // Rebuild connections based on new order
    const newConnections = rebuildConnectionsFromOrder(
      newOrder,
      connections,
      currentRoute.transportModes
    );
    
    setConnections(newConnections);
  };

  const hasLockedConnections = connections.some(c => c.isLocked);
  const hasAnyConnections = connections.length > 0;

  // Show onboarding if not completed
  if (!hasCompletedOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden relative">
      <AnimatedBackground />
      <TopBar 
        onSettingsClick={() => {
          // CRITICAL: Clear all connections when settings opens
          handleClearConnections();
          setIsSettingsOpen(true);
        }} 
        onResetRoute={handleClearConnections}
        hasConnections={connections.length > 0}
        onBackClick={() => setViewMode('wheel')}
        showBackButton={viewMode === 'route'}
      />

      {/* Ticket button - top left */}
      {/* Hide ticket button when settings modal is open */}
      {viewMode === 'wheel' && !isSettingsOpen && (
        <div className="fixed top-8 left-4 z-[100]">
          <TicketButton 
            hasActiveTicket={hasActiveTicket}
            onClick={() => setIsTicketOverviewOpen(true)}
          />
        </div>
      )}
      
      <main className="relative h-[calc(100vh-140px)]">
        <AnimatePresence mode="wait">
          {viewMode === 'wheel' ? (
            <motion.div
              key="wheel"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full"
            >
              <NavigationWheel
                destinations={destinations}
                connections={connections}
                onConnectionCreate={handleConnectionCreate}
                onConnectionLock={handleConnectionLock}
                onNodeClick={handleNodeClick}
                maxDestinations={MAX_DESTINATIONS}
                deletingNodeId={deletingNodeId}
                isEditMode={isEditMode}
                onNodeSwap={(nodeId1, nodeId2) => {
                  // Swap the order of nodes in the array to maintain defined positions
                  setDestinations(prev => {
                    const centerNode = prev.find(d => d.isCenter);
                    const otherNodes = prev.filter(d => !d.isCenter);
                    
                    const index1 = otherNodes.findIndex(d => d.id === nodeId1);
                    const index2 = otherNodes.findIndex(d => d.id === nodeId2);
                    
                    if (index1 === -1 || index2 === -1) return prev;
                    
                    // Swap nodes in array
                    const newOtherNodes = [...otherNodes];
                    [newOtherNodes[index1], newOtherNodes[index2]] = [newOtherNodes[index2], newOtherNodes[index1]];
                    
                    return centerNode 
                      ? [centerNode, ...newOtherNodes]
                      : newOtherNodes;
                  });
                }}
                onNodeDelete={(nodeId) => handleDeleteDestination(nodeId)}
                onEditModeToggle={() => setIsEditMode(!isEditMode)}
              />

              {/* Action buttons - Show route button */}
              <AnimatePresence>
                {hasAnyConnections && (
                  <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.9 }}
                    className="fixed bottom-6 left-0 right-0 z-50 flex flex-col items-center gap-3 px-4"
                  >
                    {/* Instruction text */}
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-gray-600 mb-1"
                    >
                      {hasLockedConnections ? 'Ruten din er klar! 🎉' : 'Klar til å se ruten?'}
                    </motion.p>
                    
                    {/* Buttons */}
                    <div className="flex gap-2 sm:gap-3 justify-center items-center">
                      <motion.button
                        onClick={handleClearConnections}
                        className="bg-white/95 backdrop-blur-lg text-gray-700 px-3 sm:px-6 py-2 sm:py-3 rounded-full shadow-lg border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all text-xs sm:text-base"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Avbryt
                      </motion.button>
                      <motion.button
                        onClick={handleBuildRoute}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 sm:px-10 py-2 sm:py-3 rounded-full shadow-2xl hover:shadow-3xl transition-all flex items-center gap-1 sm:gap-3 text-xs sm:text-base"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        <span>Vis reiseplan</span>
                        <svg className="w-3 h-3 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : currentRoute ? (
            <motion.div
              key="route"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <RouteVisualization
                route={currentRoute}
                destinations={destinations}
                onBack={handleBackToWheel}
                onPurchaseTicket={handlePurchaseTicket}
                onEditDestination={(destination) => {
                  setEditingDestination(destination);
                  setIsEditModalOpen(true);
                }}
                onReorderRoute={handleReorderRoute}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      {/* Step 1: Select location when user clicks a + node */}
      <SelectLocationModal
        isOpen={isSelectLocationOpen}
        onClose={() => setIsSelectLocationOpen(false)}
        onNext={(coords) => {
          // Prefill coordinates on the destination and open edit step
          if (editingDestination) {
            setEditingDestination({
              ...editingDestination,
              coordinates: coords,
            });
          }
          setIsSelectLocationOpen(false);
          setIsEditModalOpen(true);
        }}
      />

      <EditDestinationModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditDestination}
        onClear={() => editingDestination && handleClearNode(editingDestination.id)}
        onDelete={() => editingDestination && handleDeleteDestination(editingDestination.id)}
        destination={editingDestination}
        stepIndex={isSelectLocationOpen ? undefined : (editingDestination?.isEmpty ? 2 : undefined)}
        totalSteps={isSelectLocationOpen ? undefined : (editingDestination?.isEmpty ? 2 : undefined)}
      />

      {userPreferences && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          currentPreferences={userPreferences}
          onSave={handleSavePreferences}
        />
      )}

      <TicketOverview
        isOpen={isTicketOverviewOpen}
        onClose={() => setIsTicketOverviewOpen(false)}
        plannedTravelTime={viewMode === 'route' ? currentRoute?.totalTime : undefined}
        onPurchaseTicket={handlePurchaseTicket}
      />
    </div>
  );
}
