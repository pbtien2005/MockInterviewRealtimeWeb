// api.js

import { config } from "../config";
export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem("access_token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  try {
    const response = await fetch(config.apiUrl + url, {
      ...options,
      headers,
    });
    if (response.status == 401) {
      const refreshRes = await fetch(`${config.apiUrl}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!refreshRes.ok) {
        localStorage.removeItem("access_token");
        return;
      }
      const data = await refreshRes.json();
      console.log(data);
      localStorage.setItem("access_token", data.access_token);
      response = await fetch(`${config.apiUrl}` + url, {
        ...options,
        Authorization: `Bearer ${data.access_token}`, // ✅
        "Content-Type": "application/json",
      });
    } else if (!response.ok) {
      // Thử parse error message từ response body
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { detail: response.statusText };
      }

      // Tạo error object với thông tin chi tiết
      const error = new Error(
        errorData.detail || `HTTP Error: ${response.status}`
      );
      error.status = response.status;
      error.statusText = response.statusText;
      error.detail = errorData.detail;
      error.response = response;

      throw error;
    }

    // Trả về response để có thể parse JSON hoặc xử lý khác
    return response;
  } catch (error) {
    // Nếu là network error hoặc error khác
    if (!error.status) {
      const networkError = new Error("Không thể kết nối đến server");
      networkError.originalError = error;
      throw networkError;
    }

    // Re-throw error đã được xử lý ở trên
    throw error;
  }
}
