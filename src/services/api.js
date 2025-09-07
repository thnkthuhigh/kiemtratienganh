import axios from "axios";

const API_BASE_URL = import.meta.env.DEV ? "/api" : "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Exercise API functions
export const exerciseAPI = {
  // Get all exercises grouped by category
  getAll: async () => {
    try {
      const response = await api.get("/exercises");
      return response.data;
    } catch (error) {
      console.error("Error fetching exercises:", error);
      throw error;
    }
  },

  // Get exercises by category
  getByCategory: async (category) => {
    try {
      const response = await api.get(`/exercises/${category}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${category} exercises:`, error);
      throw error;
    }
  },

  // Create new exercise
  create: async (exerciseData) => {
    try {
      console.log("📤 Sending exercise data:", exerciseData);
      const response = await api.post("/exercises", exerciseData);
      return response.data;
    } catch (error) {
      console.error("Error creating exercise:", error);

      // Log detailed error information
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      } else if (error.request) {
        console.error("No response received:", error.request);
      } else {
        console.error("Error setup:", error.message);
      }

      throw error;
    }
  },

  // Update exercise
  update: async (id, exerciseData) => {
    try {
      const response = await api.put(`/exercises/${id}`, exerciseData);
      return response.data;
    } catch (error) {
      console.error("Error updating exercise:", error);
      throw error;
    }
  },

  // Delete exercise
  delete: async (id) => {
    try {
      const response = await api.delete(`/exercises/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting exercise:", error);
      throw error;
    }
  },

  // Get all exercises for admin (including inactive)
  getAllForAdmin: async () => {
    try {
      const response = await api.get("/exercises/admin/all");
      return response.data;
    } catch (error) {
      console.error("Error fetching admin exercises:", error);
      throw error;
    }
  },
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await api.get("/health");
    return response.data;
  } catch (error) {
    console.error("Health check failed:", error);
    throw error;
  }
};

export default api;
