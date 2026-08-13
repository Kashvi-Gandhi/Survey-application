import API from './api';

// Create a new Survey (Triggers stored procedure execution)
export const createSurvey = async (surveyData) => {
  const response = await API.post('/surveys', surveyData);
  return response.data;
};

// Import Questions from Bank into Survey (Triggers stored procedure execution)
export const importBankToSurvey = async (surveyId, bankId) => {
  const response = await API.post('/surveys/import-bank', {
    survey_id: surveyId,
    bank_id: bankId
  });
  return response.data;
};

// Submit Survey Responses (Public endpoint - triggers stored procedure)
export const submitSurveyResponse = async (surveyId, answers) => {
  const response = await API.post('/surveys/submit', {
    survey_id: surveyId,
    answers
  });
  return response.data;
};

// Call Analytics Stored Procedure (fn_get_survey_analytics)
export const getSurveyAnalytics = async (surveyId) => {
  const response = await API.get(`/surveys/${surveyId}/analytics`);
  return response.data;
};

export default {
  createSurvey,
  importBankToSurvey,
  submitSurveyResponse,
  getSurveyAnalytics
};