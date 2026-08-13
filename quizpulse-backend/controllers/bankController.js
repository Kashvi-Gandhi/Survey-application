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

// Get all Question Banks for current user (with full question rows)
const getBanks = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch banks for this user
    const { data: banks, error: banksError } = await supabase
      .from('question_banks')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (banksError) return errorResponse(res, 400, banksError.message);

    if (!banks || banks.length === 0) {
      return successResponse(res, 200, 'Question banks retrieved successfully', []);
    }

    // Fetch only the original (pure bank) questions — where survey_id IS NULL
    // NOTE: PostgREST does not support .is() filters on columns in related tables
    // in a joined select, so we fetch questions separately and merge.
    const bankIds = banks.map((b) => b.id);

    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .in('bank_id', bankIds)
      .is('survey_id', null);

    if (questionsError) return errorResponse(res, 400, questionsError.message);

    // Group questions by bank_id and attach to each bank
    const questionsByBank = {};
    (questions || []).forEach((q) => {
      if (!questionsByBank[q.bank_id]) questionsByBank[q.bank_id] = [];
      questionsByBank[q.bank_id].push(q);
    });

    const banksWithQuestions = banks.map((bank) => ({
      ...bank,
      questions: questionsByBank[bank.id] || []
    }));

    return successResponse(res, 200, 'Question banks retrieved successfully', banksWithQuestions);
  } catch (err) {
    return errorResponse(res, 500, 'Failed to fetch question banks', err.message);
  }
};

module.exports = { createBank, getBanks };