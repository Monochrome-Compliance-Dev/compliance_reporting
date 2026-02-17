import { fetchWrapper } from "shared/utils";
import { pickData } from "../ptrs/services/ptrsApi";

// Avoid trailing slashes
const API_ROOT = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

export const customersApi = {
  async getAll() {
    const res = await fetchWrapper.get(`${API_ROOT}/v2/customers`);
    const data = pickData(res);
    return data.items || data || [];
  },

  async getById(customerId) {
    if (!customerId) throw new Error("customerId is required");
    const res = await fetchWrapper.get(
      `${API_ROOT}/v2/customers/${customerId}`,
    );
    return pickData(res);
  },

  async create(payload) {
    if (!payload) throw new Error("payload is required");
    const res = await fetchWrapper.post(`${API_ROOT}/v2/customers`, payload);
    return pickData(res);
  },

  async update(customerId, payload) {
    if (!customerId) throw new Error("customerId is required");
    if (!payload) throw new Error("payload is required");
    const res = await fetchWrapper.put(
      `${API_ROOT}/v2/customers/${customerId}`,
      payload,
    );
    return pickData(res);
  },

  async getCustomersByAccess() {
    // The backend derives the user from the auth token; no userId param is required.
    const res = await fetchWrapper.get(`${API_ROOT}/v2/customers/access`);
    const data = pickData(res);
    return data.items || data || [];
  },
};
