
// API Configuration
// Change the 'prod' value to your production API URL
const prod = 'http://localhost:5000'; // Replace this with your production URL

export const API_BASE_URL = prod;

// API Endpoints
export const API_ENDPOINTS = {
  PANELISTS: `${API_BASE_URL}/panelists`,
  ADD_PANELIST: `${API_BASE_URL}/add-panelist`,
  SHORTLISTED_RESUMES: `${API_BASE_URL}/shortlist-resume/list`,
  DELETE_RESUME: (resumeId: string) => `${API_BASE_URL}/shortlisted-resumes/${resumeId}`,
  INTERVIEW_SESSIONS: `${API_BASE_URL}/interview-sessions`,
  DELETE_SESSION: (sessionId: number) => `${API_BASE_URL}/interview-sessions/${sessionId}`,
  DELETE_PANELIST: (panelistId: number) => `${API_BASE_URL}/panelists/${panelistId}`,
  CHECK_AVAILABILITY: (panelistId: number, date: string, startTime: string, endTime: string) => 
    `${API_BASE_URL}/check-availability?panelist_id=${panelistId}&date=${date}&start_time=${startTime}&end_time=${endTime}`,
  ASSIGN_PANEL: `${API_BASE_URL}/assign-panel`,
  JOB_REQUIREMENTS: `${API_BASE_URL}/job-requirements`,
  SAVE_SHORTLISTED_RESUME: `${API_BASE_URL}/shortlist-resume/save`
};
