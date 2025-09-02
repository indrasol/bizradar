/// <reference types="vite/client" />
// Import environment configuration
import { getApiUrl, isDevelopment } from "@/config/env";

// Get the appropriate base URL from the environment configuration
const API_BASE_URL = `${getApiUrl()}`;
// Log the API base URL being used
if (isDevelopment) {
  console.log(`Using API base URL: ${API_BASE_URL}`);
}


export const API_ENDPOINTS = {
//   ORGANIZATIONS: `${API_BASE_URL}/organizations`,
//   ORGANIZATION_INVITES: `${API_BASE_URL}/organization-invites`,
//   ORGANIZATION_MEMBERS: `${API_BASE_URL}/organization-members`,
//   PROJECTS: `${API_BASE_URL}/projects`
};