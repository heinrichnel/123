import React, { useState, useEffect, ReactNode } from "react";
import { AppProvider, useAppContext } from "./context/AppContext";
import ErrorBoundary from './components/ErrorBoundary';

// UI Components
import Header from "./components/layout/Header";
import Modal from "./components/ui/Modal";

// Feature Components
import Dashboard from "./components/dashboard/Dashboard";
import YearToDateKPIs from "./components/dashboard/YearToDateKPIs";
import ActiveTrips from "./components/trips/ActiveTrips";
import CompletedTrips from "./components/trips/CompletedTrips";
import FlagsInvestigations from "./components/flags/FlagsInvestigations";
import CurrencyFleetReport from "./components/reports/CurrencyFleetReport";
import SystemCostConfiguration from "./components/admin/SystemCostConfiguration";
import InvoiceAgingDashboard from "./components/invoicing/InvoiceAgingDashboard";
import CustomerRetentionDashboard from "./components/performance/CustomerRetentionDashboard";
import MissedLoadsTracker from "./components/trips/MissedLoadsTracker";
import DieselDashboard from "./components/diesel/DieselDashboard";
import DriverBehaviorPage from "./pages/DriverBehaviorPage";
import ActionLog from "./components/actionlog/ActionLog";
import TripDetails from "./components/trips/TripDetails";
import TripForm from "./components/trips/TripForm";

// Utilities & Types
import { Trip, MissedLoad } from "./types";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

// If LoginPage or ConnectionStatus do not exist, comment these out or provide fallback
// import LoginPage from "./components/auth/LoginPage";
// import ConnectionStatus from "./components/ui/ConnectionStatus";

const AppContent: React.FC = () => {
  // Replace with your actual authentication logic or remove if not needed
  // const { isAuthenticated, isLoading } = useReplitAuth();
  const { 
    trips, setTrips, missedLoads, addMissedLoad, updateMissedLoad, deleteMissedLoad,
    updateTrip, deleteTrip, completeTrip, systemCostRates, updateSystemCostRates
  } = useAppContext();

  // Remove or replace with your actual auth logic
  // if (isLoading) return <div>Loading...</div>;
  // if (!isAuthenticated) return <LoginPage />;

  const [currentView, setCurrentView] = useState("ytd-kpis");
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showTripForm, setShowTripForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | undefined>();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Initial load detection
  useEffect(() => {
    if (trips.length > 0 && isInitialLoad) setIsInitialLoad(false);
    const timer = setTimeout(() => {
      if (isInitialLoad) setIsInitialLoad(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [trips, isInitialLoad]);

  // Real-time Firestore listener for trips
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "trips"), (snapshot) => {
      const tripsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTrips(tripsData as Trip[]);
    });
    return () => unsub();
  }, [setTrips]);

  // Add Trip handler
  const handleAddTrip = async (tripData: Omit<Trip, "id" | "costs" | "status">) => {
    try {
      // You must implement addTrip in your context and return the new trip id
      // @ts-ignore
      const tripId = await addMissedLoad(tripData); // Replace with addTrip if available
      setShowTripForm(false);
      setEditingTrip(undefined);
      alert(`Trip created successfully!\n\nFleet: ${tripData.fleetNumber}\nDriver: ${tripData.driverName}\nRoute: ${tripData.route}\n\nTrip ID: ${tripId}`);
    } catch (error) {
      console.error("Error adding trip:", error);
      alert("Error creating trip. Please try again.");
    }
  };

  // Update Trip handler
  const handleUpdateTrip = (tripData: Omit<Trip, "id" | "costs" | "status">) => {
    if (editingTrip) {
      const updatedTrip = {
        ...editingTrip,
        ...tripData,
        costs: editingTrip.costs,
        status: editingTrip.status,
        additionalCosts: editingTrip.additionalCosts || [],
        delayReasons: editingTrip.delayReasons || [],
        followUpHistory: editingTrip.followUpHistory || [],
      };
      updateTrip(updatedTrip);
      setEditingTrip(undefined);
      setShowTripForm(false);
      alert("Trip updated successfully!");
    }
  };

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip);
    setShowTripForm(true);
  };

  const handleDeleteTrip = (id: string) => {
    const trip = trips.find((t) => t.id === id);
    if (trip && confirm(`Delete trip for fleet ${trip.fleetNumber}? This cannot be undone.`)) {
      deleteTrip(id);
      if (selectedTrip?.id === id) setSelectedTrip(null);
      alert("Trip deleted successfully.");
    }
  };

  const handleViewTrip = (trip: Trip) => setSelectedTrip(trip);

  const handleNewTrip = () => {
    setEditingTrip(undefined);
    setShowTripForm(true);
  };

  const handleCloseTripForm = () => {
    setShowTripForm(false);
    setEditingTrip(undefined);
  };

  // MissedLoadsTracker expects async handlers, so wrap context methods in async wrappers
  const handleAddMissedLoad = async (missedLoad: Omit<MissedLoad, 'id'>) => {
    return Promise.resolve(addMissedLoad(missedLoad));
  };
  const handleUpdateMissedLoad = async (missedLoad: MissedLoad) => {
    updateMissedLoad(missedLoad);
    return Promise.resolve();
  };
  const handleDeleteMissedLoad = async (id: string) => {
    deleteMissedLoad(id);
    return Promise.resolve();
  };

  // Main view switch
  const renderContent = () => {
    if (isInitialLoad) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-lg font-medium text-gray-700">Loading data...</p>
            <p className="text-sm text-gray-500 mt-2">Connecting to Firestore database</p>
          </div>
        </div>
      );
    }
    if (selectedTrip) {
      return <TripDetails trip={selectedTrip} onBack={() => setSelectedTrip(null)} />;
    }
    switch (currentView) {
      case "ytd-kpis":
        return <YearToDateKPIs trips={trips} />;
      case "dashboard":
        return <Dashboard trips={trips} />;
      case "active-trips":
        return <ActiveTrips trips={trips.filter((t) => t.status === "active")} onEdit={handleEditTrip} onDelete={handleDeleteTrip} onView={handleViewTrip} />;
      case "completed-trips":
        return <CompletedTrips trips={trips.filter((t) => ["completed", "invoiced", "paid"].includes(t.status))} onView={setSelectedTrip} />;
      case "flags":
        return <FlagsInvestigations trips={trips} />;
      case "reports":
        return <CurrencyFleetReport trips={trips} />;
      case "system-costs":
        return <SystemCostConfiguration currentRates={systemCostRates} onUpdateRates={updateSystemCostRates} userRole="admin" />;
      case "invoice-aging":
        return <InvoiceAgingDashboard trips={trips} onViewTrip={setSelectedTrip} />;
      case "customer-retention":
        return <CustomerRetentionDashboard trips={trips} />;
      case "missed-loads":
        return <MissedLoadsTracker missedLoads={missedLoads} onAddMissedLoad={handleAddMissedLoad} onUpdateMissedLoad={handleUpdateMissedLoad} onDeleteMissedLoad={handleDeleteMissedLoad} />;
      case "diesel-dashboard":
        return <DieselDashboard />;
      case "driver-behavior":
        return <DriverBehaviorPage />;
      case "action-log":
        return <ActionLog />;
      default:
        return <YearToDateKPIs trips={trips} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Header currentView={currentView} onNavigate={setCurrentView} onNewTrip={handleNewTrip} />
      <main className="flex-1 p-8 ml-64 w-full">
        {renderContent()}
      </main>
      <Modal
        isOpen={showTripForm}
        onClose={handleCloseTripForm}
        title={editingTrip ? "Edit Trip" : "Create New Trip"}
        maxWidth="lg"
      >
        <TripForm
          trip={editingTrip}
          onSubmit={editingTrip ? handleUpdateTrip : handleAddTrip}
          onCancel={handleCloseTripForm}
        />
      </Modal>
    </div>
  );
};

const App: React.FC = () => (
  <ErrorBoundary>
    <AppProvider>
      <AppContent />
    </AppProvider>
  </ErrorBoundary>
);

export default App;

export interface Trip {
  route: ReactNode;
  id: string;
  fleetNumber: string;
  status: string;
  costs: any[]; // Replace with actual cost type
  additionalCosts?: any[];
  delayReasons?: any[];
  followUpHistory?: any[];
  // ...other properties as needed
}
