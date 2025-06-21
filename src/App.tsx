<<<<<<< HEAD
// src/App.tsx

import React, { useState } from "react";
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
import { Trip } from "./types";

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
};
=======
import React, { useState, useEffect } from "react";
import { AppProvider, useAppContext } from "./context/AppContext.js";
import {
  ReplitAuthProvider,
  useReplitAuth,
} from "./context/ReplitAuthContext.js";
import Header from "./components/layout/Header.js";
import LoginPage from "./components/auth/LoginPage.js";
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
import {
  Trip,
  SystemCostRates,
  DEFAULT_SYSTEM_COST_RATES,
} from "./types/index.js";
import { Database } from "lucide-react";
import DriverBehaviorPage from "./pages/DriverBehaviorPage.js";
import TripDetails from "./components/trips/TripDetails.js";
import TripForm from "./components/trips/TripForm.js";
import ActionLog from "./components/actionlog/ActionLog.js";
import { collection, addDoc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase.js";
>>>>>>> 26992b5f0a3b081be38f1bd0501c447ccf1bbf89

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useReplitAuth();
  const { 
    trips, 
    setTrips, 
    missedLoads, 
    addMissedLoad, 
    updateMissedLoad, 
    deleteMissedLoad,
    updateTrip,
    deleteTrip,
<<<<<<< HEAD
    completeTrip,
    missedLoads,
    addMissedLoad,
    updateMissedLoad,
    deleteMissedLoad,
    systemCostRates,
    updateSystemCostRates,
=======
    completeTrip
>>>>>>> 26992b5f0a3b081be38f1bd0501c447ccf1bbf89
  } = useAppContext();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const [currentView, setCurrentView] = useState("ytd-kpis");
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showTripForm, setShowTripForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | undefined>();

<<<<<<< HEAD
  // Show trip details after adding a trip (like your working version) - Fixed to be async
  const handleAddTrip = async (tripData: Omit<Trip, "id" | "costs" | "status">) => {
=======
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
  const handleAddTrip = async (
    tripData: Omit<Trip, "id" | "costs" | "status">,
  ) => {
>>>>>>> 26992b5f0a3b081be38f1bd0501c447ccf1bbf89
    try {
      const tripId = await addTrip(tripData);
      setShowTripForm(false);
      setEditingTrip(undefined);
      
      // Show success message with trip details
      alert(`Trip created successfully!\n\nFleet: ${tripData.fleetNumber}\nDriver: ${tripData.driverName}\nRoute: ${tripData.route}\n\nTrip ID: ${tripId}`);
    } catch (error) {
      console.error("Error adding trip:", error);
      alert("Error creating trip. Please try again.");
    }
  };

<<<<<<< HEAD
  const handleUpdateTrip = (tripData: Omit<Trip, "id" | "costs" | "status">) => {
=======
  // Update Trip handler
  const handleUpdateTrip = (
    tripData: Omit<Trip, "id" | "costs" | "status">,
  ) => {
>>>>>>> 26992b5f0a3b081be38f1bd0501c447ccf1bbf89
    if (editingTrip) {
      const updatedTrip = {
        ...editingTrip,
        ...tripData,
        // Preserve existing fields that shouldn't be overwritten
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
    console.log('Setting editing trip:', trip);
    setEditingTrip(trip);
    setShowTripForm(true);
  };

  const handleDeleteTrip = (id: string) => {
    const trip = trips.find((t) => t.id === id);
    if (
      trip &&
      confirm(
        `Delete trip for fleet ${trip.fleetNumber}? This cannot be undone.`,
      )
    ) {
      deleteTrip(id);
      if (selectedTrip?.id === id) {
        setSelectedTrip(null);
      }
      alert("Trip deleted successfully.");
    }
  };

  const handleViewTrip = (trip: Trip) => {
    setSelectedTrip(trip);
  };

  const handleCompleteTrip = async (tripId: string) => {
    try {
      await completeTrip(tripId);
      alert("Trip completed successfully!");
    } catch (error: any) {
      alert(error.message || "Failed to complete trip");
    }
  };

  const handleNewTrip = () => {
    setEditingTrip(undefined);
    setShowTripForm(true);
  };

  const handleCloseTripForm = () => {
    setShowTripForm(false);
    setEditingTrip(undefined);
  };

  // Main view switch: ensure all dashboard sections are included
  const renderContent = () => {
<<<<<<< HEAD
=======
    if (isInitialLoad) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-lg font-medium text-gray-700">Loading data...</p>
            <p className="text-sm text-gray-500 mt-2">
              Connecting to Firestore database
            </p>
            <div className="flex items-center justify-center mt-4 space-x-2">
              <Database className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-blue-600">
                Establishing real-time connection
              </span>
            </div>
          </div>
        </div>
      );
    }

>>>>>>> 26992b5f0a3b081be38f1bd0501c447ccf1bbf89
    if (selectedTrip) {
      return (
        <TripDetails trip={selectedTrip} onBack={() => setSelectedTrip(null)} />
      );
    }
    switch (currentView) {
      case "ytd-kpis":
        return <YearToDateKPIs trips={trips} />;
      case "dashboard":
        return <Dashboard trips={trips} />;
      case "active-trips":
        return <ActiveTrips
          trips={trips.filter((t) => t.status === "active")}
          onEdit={handleEditTrip}
          onDelete={handleDeleteTrip}
          onView={handleViewTrip}
          onCompleteTrip={handleCompleteTrip}
        />;
      case "completed-trips":
<<<<<<< HEAD
        return <CompletedTrips trips={trips.filter((t) => ["completed", "invoiced", "paid"].includes(t.status))} onView={setSelectedTrip} />;
=======
        return (
          <CompletedTrips
            trips={trips.filter((t) =>
              ["completed", "invoiced", "paid"].includes(t.status),
            )}
            onView={setSelectedTrip}
          />
        );
>>>>>>> 26992b5f0a3b081be38f1bd0501c447ccf1bbf89
      case "flags":
        return <FlagsInvestigations trips={trips} />;
      case "reports":
        return <CurrencyFleetReport trips={trips} />;
      case "system-costs":
        return (
          <SystemCostConfiguration
            currentRates={systemCostRates}
            onUpdateRates={updateSystemCostRates}
            userRole="admin"
          />
        );
      case "invoice-aging":
        return <InvoiceAgingDashboard trips={trips} onViewTrip={setSelectedTrip} />;
      case "customer-retention":
        return <CustomerRetentionDashboard trips={trips} />;
      case "missed-loads":
        return <MissedLoadsTracker missedLoads={missedLoads} onAddMissedLoad={addMissedLoad} onUpdateMissedLoad={updateMissedLoad} onDeleteMissedLoad={deleteMissedLoad} />;
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

<<<<<<< HEAD
export default App;
=======
const App: React.FC = () => (
  <ReplitAuthProvider>
    <AppProvider>
      <AppContent />
    </AppProvider>
  </ReplitAuthProvider>
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
>>>>>>> 26992b5f0a3b081be38f1bd0501c447ccf1bbf89
