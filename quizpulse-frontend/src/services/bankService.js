import API from './api';

export const getQuestionBanks = async () => {
  const response = await API.get('/banks');
  return response.data;
};

export const createQuestionBank = async (bankData) => {
  const response = await API.post('/banks', bankData);
  return response.data;
};

export const addQuestionToBank = async (questionData) => {
  // Map frontend display type names to PostgreSQL enum values
  const typeMap = {
    mcq: 'single_select',
    multi_select: 'multi_select',
    rating: 'rating',
    text: 'one_line',
    true_false: 'true_false'
  };

  const payload = {
    bank_id: questionData.bank_id || questionData.bankId,
    question_text: questionData.question_text || questionData.questionText,
    question_type: typeMap[questionData.type || questionData.question_type] || questionData.question_type,
    options: questionData.options || null
  };

  const response = await API.post('/questions', payload);
  return response.data;
};

export default {
  getQuestionBanks,
  createQuestionBank,
  addQuestionToBank
};