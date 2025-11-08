// Simple localStorage wrapper for reservation data
// No encryption, just reliable storage

interface ReservationData {
  [reservationId: string]: {
    full_name: string;
    phone_number: string;
    age: string;
    gender: string;
    notes?: string;
  };
}

const STORAGE_KEY = 'manual_reservations_data';

export const SimpleReservationStorage = {
  // Save reservation data
  save(reservationId: number, data: {
    full_name: string;
    phone_number: string;
    age: string;
    gender: string;
    notes?: string;
  }): void {
    try {
      const existing = this.getAll();
      existing[reservationId.toString()] = data;
      const jsonData = JSON.stringify(existing);
      localStorage.setItem(STORAGE_KEY, jsonData);
    } catch (error) {
      // Silent fail
    }
  },

  // Get single reservation data
  get(reservationId: number): any {
    try {
      const all = this.getAll();
      return all[reservationId.toString()] || null;
    } catch (error) {
      return null;
    }
  },

  // Get all reservation data
  getAll(): ReservationData {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      return {};
    }
  },

  // Clear all
  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      // Silent fail
    }
  }
};

