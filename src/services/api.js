import axios from "axios";

// API Base URL configuration for different environments
const getApiBaseUrl = () => {
  // Production: Use your Render backend URL
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || "https://your-app-name.onrender.com/api";
  }
  
  // Development: Use local server
  return import.meta.env.VITE_API_URL || "http://localhost:5000/api";
};

const API_BASE_URL = getApiBaseUrl();

console.log("🌐 API Base URL:", API_BASE_URL);
console.log("🏗️ Environment:", import.meta.env.MODE);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds timeout for production
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log("📤 API Request:", config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    console.error("📤 API Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log("📥 API Response:", response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    console.error("📥 API Response Error:", error.response?.status, error.config?.url);
    
    if (error.response?.status === 404) {
      console.error("API endpoint not found. Check if backend is running.");
    } else if (error.code === 'ECONNABORTED') {
      console.error("API request timeout. Backend may be slow or unavailable.");
    } else if (!error.response) {
      console.error("Network error. Check if backend is accessible.");
    }
    
    return Promise.reject(error);
  }
);

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

// User API functions
export const userAPI = {
  // Register new user
  register: async (userData) => {
    try {
      const response = await api.post("/users/register", userData);
      return response.data;
    } catch (error) {
      console.error("Error registering user:", error);
      throw error;
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post("/users/login", credentials);
      return response.data;
    } catch (error) {
      console.error("Error logging in:", error);
      throw error;
    }
  },

  // Update user statistics với thời gian làm bài
  updateStats: async (userId, results, timeSpent = {}) => {
    try {
      const response = await api.post(`/users/stats/${userId}`, { 
        results, 
        timeSpent 
      });
      return response.data;
    } catch (error) {
      console.error("Error updating stats:", error);
      throw error;
    }
  },

  // Get user statistics
  getStats: async (userId) => {
    try {
      const response = await api.get(`/users/stats/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error getting stats:", error);
      throw error;
    }
  },

  // Get priority questions for practice
  getPriorityQuestions: async (userId, category = null, limit = 10) => {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      params.append('limit', limit.toString());
      
      const response = await api.get(`/users/priority-questions/${userId}?${params}`);
      return response.data;
    } catch (error) {
      console.error("Error getting priority questions:", error);
      throw error;
    }
  },

  // Get detailed performance stats
  getPerformance: async (userId) => {
    try {
      const response = await api.get(`/users/performance/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error getting performance:", error);
      throw error;
    }
  },

  // Get answer history
  getHistory: async (userId, category = null, limit = 50, page = 1) => {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      params.append('limit', limit.toString());
      params.append('page', page.toString());
      
      const response = await api.get(`/users/history/${userId}?${params}`);
      return response.data;
    } catch (error) {
      console.error("Error getting history:", error);
      throw error;
    }
  },

  // Get weak points analysis
  getWeakPoints: async (userId, category = null) => {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      
      const response = await api.get(`/users/weak-points/${userId}?${params}`);
      return response.data;
    } catch (error) {
      console.error("Error getting weak points:", error);
      throw error;
    }
  }
};

export default api;
