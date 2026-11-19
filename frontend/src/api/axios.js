import axios from "axios";
import { clearCache } from "./cache";

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

// Login / signup / reset calls can legitimately return 401 - don't treat those as "session expired".
const AUTH_PATHS = ["/auth/login", "/auth/register", "/auth/forgot-password", "/auth/reset-password"];

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("wealthflow_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => {
    // Any create/update/delete makes cached data stale
    if ((res.config.method || "get").toLowerCase() !== "get") clearCache();
    return res;
  },
  (err) => {
    const url = err.config?.url || "";
    const isAuthCall = AUTH_PATHS.some((p) => url.startsWith(p));
    if (err.response?.status === 401 && !isAuthCall && localStorage.getItem("wealthflow_token")) {
      localStorage.removeItem("wealthflow_token");
      localStorage.removeItem("wealthflow_user");
      clearCache();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
