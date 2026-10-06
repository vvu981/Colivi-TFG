import axios from "axios";
import { ENV } from "../config/env";

export const apiClient = axios.create({
  baseURL: ENV.API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});