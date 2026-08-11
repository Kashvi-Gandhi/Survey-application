const { supabase } = require('../config/supabase');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

// Create a new Question Bank
const createBank = async (req, res) => {
  try {
    const { title, description } = req.body;
    const userId = req.user.id;

    if (!title) {
      return errorResponse(res, 400, 'Question bank title is required');
    }

    const { data, error } = await supabase
      .from('question_banks')
      .insert([{ title, description, created_by: userId }])
      .select()
      .single();

    if (error) return errorResponse(res, 400, error.message);

    return successResponse(res, 201, 'Question bank created successfully', data);
  } catch (err) {
    return errorResponse(res, 500, 'Failed to create question bank', err.message);
  }
};

// Get all Question Banks for current user
const getBanks = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('question_banks')
      .select('*, questions(count)')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) return errorResponse(res, 400, error.message);

    return successResponse(res, 200, 'Question banks retrieved successfully', data);
  } catch (err) {
    return errorResponse(res, 500, 'Failed to fetch question banks', err.message);
  }
};

module.exports = { createBank, getBanks };