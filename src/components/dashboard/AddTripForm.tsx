// ─── React ───────────────────────────────────────────────────────
import React, { useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────
import { Trip } from '../../types';

// ─── UI Components ───────────────────────────────────────────────
import Button from '../ui/Button';
import { Input, Select, TextArea } from '../ui/FormElements';

// ─── Icons ───────────────────────────────────────────────────────
import {
  Save,
  X,
  Calendar,
  MapPin,
  DollarSign,
  User
} from 'lucide-react';

// ─── Utilities ───────────────────────────────────────────────────
import { formatCurrency, formatDate } from '../../utils/helpers';


interface AddTripFormProps {
  onAddTrip: (trip: Trip) => void;
}

export const AddTripForm: React.FC<AddTripFormProps> = ({ onAddTrip }) => {
  const [tripName, setTripName] = useState('');
  const [driverName, setDriverName] = useState('');
  const [client, setClient] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newTrip: Trip = {
      id: `${Date.now()}`,
      tripName,
      driverName,
      client,
      status: 'active',
      baseRevenue: 0,
      revenueCurrency: 'USD',
      costs: [],
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString()
    };

    onAddTrip(newTrip);

    setTripName('');
    setDriverName('');
    setClient('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-md shadow-md">
      <h3 className="text-xl font-semibold">Add New Trip</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700">Trip Name</label>
        <input
          type="text"
          value={tripName}
          onChange={(e) => setTripName(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Driver Name</label>
        <input
          type="text"
          value={driverName}
          onChange={(e) => setDriverName(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Client</label>
        <input
          type="text"
          value={client}
          onChange={(e) => setClient(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Add Trip
      </button>
    </form>
  );
};
