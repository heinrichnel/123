export const filterTripsByDateRange = (trips: Trip[], startDate?: string, endDate?: string): Trip[] => {
  if (!trips || !Array.isArray(trips)) return [];
  if (!startDate && !endDate) return trips;

  try {
    return trips.filter(trip => {
      if (!trip.startDate || !trip.endDate) return false;

      const tripStart = new Date(trip.startDate);
      const tripEnd = new Date(trip.endDate);

      if (startDate && tripStart < new Date(startDate)) return false;
      if (endDate && tripEnd > new Date(endDate)) return false;

      return true;
    });
  } catch (error) {
    console.error('Error filtering trips by date range:', error);
    return trips;
  }
};

export const filterTripsByClient = (trips: Trip[], client: string): Trip[] => {
  if (!trips || !Array.isArray(trips)) return [];
  if (!client) return trips;

  try {
    return trips.filter(trip => trip.clientName === client);
  } catch (error) {
    console.error('Error filtering trips by client:', error);
    return trips;
  }
};

export const filterTripsByCurrency = (trips: Trip[], currency: string): Trip[] => {
  if (!trips || !Array.isArray(trips)) return [];
  if (!currency) return trips;

  try {
    return trips.filter(trip => trip.revenueCurrency === currency);
  } catch (error) {
    console.error('Error filtering trips by currency:', error);
    return trips;
  }
};

export const filterTripsByDriver = (trips: Trip[], driver: string): Trip[] => {
  if (!trips || !Array.isArray(trips)) return [];
  if (!driver) return trips;

  try {
    return trips.filter(trip => trip.driverName === driver);
  } catch (error) {
    console.error('Error filtering trips by driver:', error);
    return trips;
  }
};
