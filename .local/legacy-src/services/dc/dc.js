import { fetchWrapper } from "../../lib/utils/fetch-wrapper";

const baseUrl = `${process.env.REACT_APP_API_URL}/data-cleanse`;

export const dcService = {
  getAbnCandidatesForNames,
};

async function getAbnCandidatesForNames(names) {
  if (!Array.isArray(names) || names.length === 0) {
    throw new Error("Input must be a non-empty array of names");
  }

  return await fetchWrapper.post(`${baseUrl}/abn-lookup`, names);
}
