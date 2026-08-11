const { supabase } = require('../config/supabase');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

// Add a Question to a Bank or Survey
const createQuestion = async (req, res) => {
  try {
    const {
      bank_id,
      survey_id,
      question_text,
      question_type,
      points,
      is_required,
      options,
      correct_answer
    } = req.body;

    // Validation
    if (!question_text || !question_type) {
      return errorResponse(res, 400, 'Question text and question type are required');
    }

    const validTypes = ['single_select', 'multi_select', 'true_false', 'one_line', 'rating'];
    if (!validTypes.includes(question_type)) {
      return errorResponse(res, 400, `Invalid type. Allowed: ${validTypes.join(', ')}`);
    }

    const { data, error } = await supabase
      .from('questions')
      .insert([{
        bank_id: bank_id || null,
        survey_id: survey_id || null,
        question_text,
        question_type,
        points: points || 1,
        is_required: is_required !== undefined ? is_required : true,
        options,        // Stores JSONB array or config object
        correct_answer  // Stores JSONB target answer
      }])
      .select()
      .single();

    if (error) return errorResponse(res, 400, error.message);

    return successResponse(res, 201, 'Question created successfully', data);
  } catch (err) {
    return errorResponse(res, 500, 'Failed to create question', err.message);
  }
};

module.exports = { createQuestion };