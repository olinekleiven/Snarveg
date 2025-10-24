import React, { useState, useEffect } from 'react';
import TopBar from './components/travel/TopBar';
import NavigationWheel from './components/travel/NavigationWheel';
import EditDestinationModal from './components/travel/EditDestinationModal';
import RouteVisualization from './components/travel/RouteVisualization';
import OnboardingFlow, { UserPreferences } from './components/travel/OnboardingFlow';
import SettingsModal from './components/travel/SettingsModal';
import TicketButton from './components/travel/TicketButton';
import TicketOverview from './components/travel/TicketOverview';
import AnimatedBackground from './components/travel/AnimatedBackground';
import { Destination, Route, Connection } from './components/travel/types';
import { INITIAL_DESTINATIONS, TRANSPORT_MODE_EMOJIS, STORAGE_KEYS } from './utils/constants';
import { 
  buildRouteFromConnections, 
  getRandomTransportMode,
  connectionExists,
  hasOutgoingConnection,
  rebuildConnectionsFromOrder,
  checkActiveTicket
} from './utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [userPreferences, setUserPreferences] = useState(null);
  const [destinations, setDestinations] = useState(INITIAL_DESTINATIONS);
  const [connections, setConnections] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTicketOverviewOpen, setIsTicketOverviewOpen] = useState(false);
  const [editingDestination, setEditingDestination] = useState(null);
  const [viewMode, setViewMode] = useState('wheel');
  const [currentRoute, setCurrentRoute] = useState(null);
  const [hasActiveTicket, setHasActiveTicket] = useState(false);

  // Check if user has completed onboarding
  useEffect(() => {
    const onboardingComplete = localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
    const savedPreferences = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    
    if (onboardingComplete === 'true' && savedPreferences) {
      setHasCompletedOnboarding(true);
      setUserPreferences(JSON.parse(savedPreferences));
    }

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

  const handlePurchaseTicket = (ticketType: string, duration: number, price: number) => {
    setHasActiveTicket(true);
    // Modal will close automatically after purchase
  };

  const handlePreferencesUpdate = (preferences: UserPreferences) => {
    setUserPreferences(preferences);
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
    console.log('Updated preferences:', preferences);
  };

  const handleConnectionCreate = (from: string, to: string) => {
    // Check if connection already exists
    if (connectionExists(connections, from, to)) {
      console.log('Connection already exists');
      return;
    }

    // Check if the FROM node already has an outgoing connection
    if (hasOutgoingConnection(connections, from)) {
      console.log(`Node ${from} already has an outgoing connection`);
      return;
    }

    const randomTransport = getRandomTransportMode();
    setConnections([...connections, { 
      from, 
      to, 
      isLocked: false,
      transportMode: randomTransport,
      createdAt: Date.now()
    }]);
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
    setDestinations(prev => prev.map(d => d.id === destination.id ? destination : d));
  };

  const handleNodeClick = (destination: Destination) => {
    setEditingDestination(destination);
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
        onSettingsClick={() => setIsSettingsOpen(true)} 
        onResetRoute={handleClearConnections}
        hasConnections={connections.length > 0}
        onBackClick={() => setViewMode('wheel')}
        showBackButton={viewMode === 'route'}
      />

      {/* Ticket button - top left */}
      {viewMode === 'wheel' && (
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

      <EditDestinationModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditDestination}
        destination={editingDestination}
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
