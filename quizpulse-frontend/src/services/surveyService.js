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

// Import Selected Questions into Survey
export const importSelectedQuestions = async (surveyId, bankId, questionIds) => {
  const response = await API.post('/surveys/import-selected', {
    survey_id: surveyId,
    bank_id: bankId,
    question_ids: questionIds
  });
  return response.data;
};

// Submit Survey Responses (Public endpoint - triggers stored procedure)
export const submitSurveyResponse = async (surveyId, answers, takerName = null, takerEmail = null) => {
  const payload = {
    survey_id: surveyId,
    answers
  };

  // Include taker info for anonymous submissions
  if (takerName && takerEmail) {
    payload.taker_name = takerName;
    payload.taker_email = takerEmail;
  }

  const response = await API.post('/surveys/submit', payload);
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
  importSelectedQuestions,
  submitSurveyResponse,
  getSurveyAnalytics
};