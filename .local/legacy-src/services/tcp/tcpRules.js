import { fetchWrapper } from "../../lib/utils";
const baseUrl = `${process.env.REACT_APP_API_URL}/tcp-rules`;

export const tcpRulesService = {
  create,
  getByClient,
  delete: _delete,
};

function create(rule) {
  return fetchWrapper.post(`${baseUrl}`, rule);
}

function getByClient(clientId) {
  return fetchWrapper.get(`${baseUrl}/client/${clientId}`);
}

function _delete(id) {
  return fetchWrapper.delete(`${baseUrl}/${id}`);
}
