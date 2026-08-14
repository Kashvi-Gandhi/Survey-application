import API from './api';

export const getAdminMetrics = async () => (await API.get('/admin/metrics')).data;
export const getAdminSurveyors = async () => (await API.get('/admin/surveyors')).data;
export const updateSurveyorStatus = async (surveyorId, isActive) => (
  await API.patch(`/admin/surveyors/${surveyorId}/status`, { is_active: isActive })
).data;

export const getSystemSurveys = async () => (await API.get('/admin/surveys')).data;
export const updateSystemSurveyStatus = async (surveyId, status) => (
  await API.patch(`/admin/surveys/${surveyId}/status`, { status })
).data;
