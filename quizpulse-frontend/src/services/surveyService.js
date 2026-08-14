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

// surveyId is optional for question-bank drafts; those items include bank_id.
export const createQuestionsBatch = async (surveyId, questions) => {
  const response = await API.post('/questions/batch', {
    survey_id: surveyId || null,
    questions
  });
  return response.data;
};

export const deleteQuestion = async (questionId) => {
  const response = await API.delete(`/questions/${questionId}`);
  return response.data;
};

export const updateSurvey = async (surveyId, surveyData) => {
  const response = await API.put(`/surveys/${surveyId}`, surveyData);
  return response.data;
};

export const deleteSurvey = async (surveyId) => {
  const response = await API.delete(`/surveys/${surveyId}`);
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
  createQuestionsBatch,
  deleteQuestion,
  updateSurvey,
  deleteSurvey,
  submitSurveyResponse,
  getSurveyAnalytics
};
