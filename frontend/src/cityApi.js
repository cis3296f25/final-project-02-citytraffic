// src/api/cityApi.js

// Determine API base URL based on environment
const getApiBase = () => {
  if (import.meta.env.MODE === 'development') {
    return '/api'; // Use proxy in development
  } else {
    // In production, you have two options:
    
    // Option 1: If you deploy Django separately
    // return 'https://your-django-app.herokuapp.com/api';
    
    // Option 2: If you want to use GitHub Pages only (static)
    return '/api'; // This will fail unless you have a separate backend
  }
};

const API_BASE = getApiBase();

export const cityApi = {
  async getCities() {
    try {
      const response = await fetch(`${API_BASE}/city-edits/`);
      if (!response.ok) throw new Error('Failed to fetch cities');
      return await response.json();
    } catch (error) {
      console.error('Error fetching cities:', error);
      
      // Return mock data for GitHub Pages demo
      if (import.meta.env.MODE === 'production') {
        return [
          {
            id: 1,
            title: "Demo City",
            grid_data: [],
            rows: 16,
            cols: 25,
            selected_tool: "select",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
      }
      return [];
    }
  },

  async saveCity(cityData) {
    try {
      // In production without backend, just simulate success
      if (import.meta.env.MODE === 'production' && !API_BASE.startsWith('http')) {
        console.log('Simulating save in production mode');
        return {
          ...cityData,
          id: Date.now(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

      const response = await fetch(`${API_BASE}/city-edits/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cityData),
      });
      
      if (!response.ok) throw new Error('Failed to save city');
      return await response.json();
    } catch (error) {
      console.error('Error saving city:', error);
      
      // Simulate success for demo purposes
      if (import.meta.env.MODE === 'production') {
        return {
          ...cityData,
          id: Date.now(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      throw error;
    }
  },

  // ... rest of your API methods with similar production fallbacks
  async updateCity(id, cityData) {
    try {
      if (import.meta.env.MODE === 'production' && !API_BASE.startsWith('http')) {
        console.log('Simulating update in production mode');
        return { ...cityData, id, updated_at: new Date().toISOString() };
      }

      const response = await fetch(`${API_BASE}/city-edits/${id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cityData),
      });
      
      if (!response.ok) throw new Error('Failed to update city');
      return await response.json();
    } catch (error) {
      console.error('Error updating city:', error);
      if (import.meta.env.MODE === 'production') {
        return { ...cityData, id, updated_at: new Date().toISOString() };
      }
      throw error;
    }
  },

  async deleteCity(id) {
    try {
      if (import.meta.env.MODE === 'production' && !API_BASE.startsWith('http')) {
        console.log('Simulating delete in production mode');
        return true;
      }

      const response = await fetch(`${API_BASE}/city-edits/${id}/`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete city');
      return true;
    } catch (error) {
      console.error('Error deleting city:', error);
      if (import.meta.env.MODE === 'production') {
        return true;
      }
      throw error;
    }
  }
};