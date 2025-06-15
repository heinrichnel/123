import React, { useState, useEffect } from "react";
import { AppProvider, useAppContext } from "./context/AppContext.js";
import Header from "./components/layout/Header.js";
import Dashboard from "./components/dashboard/Dashboard.js";
import YearToDateKPIs from "./components/dashboard/YearToDateKPIs.js";
import ActiveTrips from "./components/trips/ActiveTrips.js";
import CompletedTrips from "./components/trips/CompletedTrips.js";
import FlagsInvestigations from "./components/flags/FlagsInvestigations.js";
import CurrencyFleetReport from "./components/reports/CurrencyFleetReport.js";
import InvoiceAgingDashboard from "./components/invoicing/InvoiceAgingDashboard.js";
import CustomerRetentionDashboard from "./components/performance/CustomerRetentionDashboard.js";
import MissedLoadsTracker from "./components/trips/MissedLoadsTracker.js";
import DieselDashboard from "./components/diesel/DieselDashboard.js";
import Modal from "./components/ui/Modal.js";
import ConnectionStatus from "./components/ui/ConnectionStatus.js";
import { Trip, SystemCostRates, DEFAULT_SYSTEM_COST_RATES } from "./types/index.js";
import { Database } from "lucide-react";
import DriverBehaviorPage from "./pages/DriverBehaviorPage.js";
import TripDetails from "./components/trips/TripDetails.js";
import TripForm from "./components/trips/TripForm.js";
import ActionLog from "./components/actionlog/ActionLog.js";
import { collection, addDoc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase.js";

const AppContent: React.FC = () => {
  const {
    trips,
    addTrip,
    updateTrip,
    deleteTrip,
    completeTrip,
    missedLoads,
    addMissedLoad,
    updateMissedLoad,
    deleteMissedLoad,
    connectionStatus,
    setTrips,
  } = useAppContext();

  const [currentView, setCurrentView] = useState("ytd-kpis");
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showTripForm, setShowTripForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | undefined>();
  const [systemCostRates, setSystemCostRates] = useState<
    Record<"USD" | "ZAR", SystemCostRates>
  >(DEFAULT_SYSTEM_COST_RATES);
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
      const tripsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTrips(tripsData as Trip[]);
    });
    return () => unsub();
  }, [setTrips]);

  // Add Trip handler
  const handleAddTrip = async (tripData: Omit<Trip, "id" | "costs" | "status">) => {
    try {
      const newTrip = {
        ...tripData,
        status: "active",
        costs: [],
      };
      await addDoc(collection(db, "trips"), newTrip);
      setShowTripForm(false);
      setEditingTrip(undefined);
      alert(`Trip created successfully!\n\nFleet: ${tripData.fleetNumber}`);
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

  // Edit trip form open
  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip);
    setShowTripForm(true);
  };

  // Delete trip handler
  const handleDeleteTrip = (id: string) => {
    const trip = trips.find((t) => t.id === id);
    if (trip && confirm(`Delete trip for fleet ${trip.fleetNumber}? This cannot be undone.`)) {
      deleteTrip(id);
      if (selectedTrip?.id === id) setSelectedTrip(null);
      alert("Trip deleted successfully.");
    }
  };

  // Complete trip handler
  const handleCompleteTrip = async (tripId: string) => {
    try {
      await completeTrip(tripId);
      alert("Trip completed successfully!");
    } catch (error: any) {
      alert(error.message || "Failed to complete trip");
    }
  };

  // View trip details handler
  const handleViewTrip = (trip: Trip) => {
    setSelectedTrip(trip);
  };

  // Add new trip handler (open form)
  const handleNewTrip = () => {
    setEditingTrip(undefined);
    setShowTripForm(true);
  };

  // Close trip form modal
  const handleCloseTripForm = () => {
    setShowTripForm(false);
    setEditingTrip(undefined);
  };

  // Content renderer by view
  const renderContent = () => {
    if (isInitialLoad) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-lg font-medium text-gray-700">Loading data...</p>
            <p className="text-sm text-gray-500 mt-2">Connecting to Firestore database</p>
            <div className="flex items-center justify-center mt-4 space-x-2">
              <Database className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-blue-600">Establishing real-time connection</span>
            </div>
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
        return (
          <ActiveTrips
            trips={trips.filter((t) => t.status === "active")}
            onEdit={handleEditTrip}
            onDelete={handleDeleteTrip}
            onView={handleViewTrip}
          />
        );
      case "completed-trips":
        return (
          <CompletedTrips
            trips={trips.filter((t) =>
              ["completed", "invoiced", "paid"].includes(t.status)
            )}
            onView={setSelectedTrip}
          />
        );
      case "flags":
        return <FlagsInvestigations trips={trips} />;
      case "reports":
        return <CurrencyFleetReport trips={trips} />;
      case "invoice-aging":
        return (
          <InvoiceAgingDashboard trips={trips} onViewTrip={setSelectedTrip} />
        );
      case "customer-retention":
        return <CustomerRetentionDashboard trips={trips} />;
      case "missed-loads":
        return (
          <MissedLoadsTracker
            missedLoads={missedLoads}
            onAddMissedLoad={addMissedLoad}
            onUpdateMissedLoad={updateMissedLoad}
            onDeleteMissedLoad={deleteMissedLoad}
          />
        );
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
      <Header
        currentView={currentView}
        onNavigate={setCurrentView}
        onNewTrip={handleNewTrip}
      />
      <main className="flex-1 p-8 ml-64 w-full">{renderContent()}</main>
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
      <ConnectionStatus />
    </div>
  );
};

const App: React.FC = () => (
  <AppProvider>
    <AppContent />
  </AppProvider>
);

export default App;

export interface Trip {
  id: string;
  fleetNumber: string;
  status: string;
  costs: any[]; // Replace with actual cost type
  additionalCosts?: any[];
  delayReasons?: any[];
  followUpHistory?: any[];
  // ...other properties as needed
}
