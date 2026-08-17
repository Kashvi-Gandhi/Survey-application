import API from './api';

export const getAdminMetrics = async () => (await API.get('/admin/metrics')).data;
export const getAdminSurveyors = async () => (await API.get('/admin/surveyors')).data;
export const updateAdminUser = async (userId, userData) => (
  await API.put(`/admin/surveyors/${userId}`, userData)
).data;
export const updateSurveyorStatus = async (surveyorId, isActive) => (
  await API.patch(`/admin/surveyors/${surveyorId}/status`, { is_active: isActive })
).data;

export const getSystemSurveys = async () => (await API.get('/admin/surveys')).data;
export const updateSystemSurveyStatus = async (surveyId, status) => (
  await API.patch(`/admin/surveys/${surveyId}/status`, { status })
).data;
export const updateSystemSurvey = async (surveyId, survey) => (
  await API.put(`/admin/surveys/${surveyId}`, survey)
).data;

export const getMasterQuestionBanks = async () => (await API.get('/admin/question-banks')).data;
export const createMasterQuestionBank = async (bank) => (await API.post('/admin/question-banks', bank)).data;
export const updateMasterQuestionBank = async (bankId, bank) => (await API.put(`/admin/question-banks/${bankId}`, bank)).data;
export const deleteMasterQuestionBank = async (bankId) => (await API.delete(`/admin/question-banks/${bankId}`)).data;
