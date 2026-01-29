import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://127.0.0.1:8000/admin",
});

export const API_BASE_URL = "http://127.0.0.1:8000";

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const errorMessage =
      error.response?.data?.detail || error.message || "Something went wrong";
    return Promise.reject(new Error(errorMessage));
  }
);

export const adminApi = {
  getStats: async () => {
    const response = await apiClient.get("/stats");
    return response.data;
  },

  // --- Student API ---
  getStudents: async (filters) => {
    const response = await apiClient.get("/students", { params: filters });
    return response.data;
  },
  createStudent: async (studentData) => {
    const response = await apiClient.post("/students", studentData);
    return response.data;
  },
  updateStudent: async (userId, studentData) => {
    const response = await apiClient.put(`/students/${userId}`, studentData);
    return response.data;
  },
  deleteStudent: async (userId) => {
    await apiClient.delete(`/students/${userId}`);
    return null;
  },

  // --- Coacher API ---
  getCoachers: async (filters) => {
    const response = await apiClient.get("/coachers", { params: filters });
    return response.data;
  },
  createCoacher: async (coacherData) => {
    const response = await apiClient.post("/coachers", coacherData);
    return response.data;
  },
  updateCoacher: async (userId, coacherData) => {
    const response = await apiClient.put(`/coachers/${userId}`, coacherData);
    return response.data;
  },
  deleteCoacher: async (userId) => {
    await apiClient.delete(`/coachers/${userId}`);
    return null;
  },

  getUserProfile: async (userId) => {
    const response = await apiClient.get(`/profile/${userId}`);
    return response.data;
  },
  addCertificate: async (userId, certData) => {
    const response = await apiClient.post(
      `/users/${userId}/certificates`,
      certData
    );
    return response.data;
  },
  deleteCertificate: async (userId, certId) => {
    await apiClient.delete(`/certificates/${userId}/${certId}`);
    return null;
  },

  getStudentCoachers: async (userId) => {
    const response = await apiClient.get(`/students/${userId}/coachers`);
    return response.data;
  },

  getCoacherStudents: async (userId) => {
    const response = await apiClient.get(`/coachers/${userId}/students`);
    return response.data;
  },
  getCoacherRanking: async (limit = 5) => {
    const response = await apiClient.get("/coachers/ranking", {
      params: { limit },
    });
    return response.data;
  },
};
