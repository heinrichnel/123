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
    systemCostRates,
    updateSystemCostRates,
  } = useAppContext();

  const [currentView, setCurrentView] = useState("ytd-kpis");
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showTripForm, setShowTripForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | undefined>();

  // Show trip details after adding a trip (like your working version) - Fixed to be async
  const handleAddTrip = async (tripData: Omit<Trip, "id" | "costs" | "status">) => {
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

  const handleUpdateTrip = (tripData: Omit<Trip, "id" | "costs" | "status">) => {
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
    if (trip && confirm(`Delete trip for fleet ${trip.fleetNumber}? This cannot be undone.`)) {
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
    if (selectedTrip) {
      return <TripDetails trip={selectedTrip} onBack={() => setSelectedTrip(null)} />;
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
        return <CompletedTrips trips={trips.filter((t) => ["completed", "invoiced", "paid"].includes(t.status))} onView={setSelectedTrip} />;
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
      case "admin":
        return <div className="p-8 text-center text-gray-500">Admin panel coming soon...</div>;
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

export default App;