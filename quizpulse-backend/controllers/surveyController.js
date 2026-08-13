const { supabase } = require('../config/supabase');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

// Create a new Survey shell
// Create a new Survey shell
const createSurvey = async (req, res) => {
  try {
    const { title, description } = req.body;
    const userId = req.user.id;

    if (!title) {
      return errorResponse(res, 400, 'Survey title is required');
    }

    const { data, error } = await supabase
      .from('surveys')
      .insert([{
        title,
        description,
        created_by: userId
      }])
      .select()
      .single();

    if (error) return errorResponse(res, 400, error.message);

    return successResponse(res, 201, 'Survey created successfully', data);
  } catch (err) {
    return errorResponse(res, 500, 'Failed to create survey', err.message);
  }
};

// Copy questions from a Question Bank directly into a Survey
const addQuestionsFromBank = async (req, res) => {
  try {
    const { survey_id, bank_id } = req.body;

    if (!survey_id || !bank_id) {
      return errorResponse(res, 400, 'survey_id and bank_id are required');
    }

    // Fetch questions from bank (only pure bank questions, not copies already in surveys)
    const { data: bankQuestions, error: fetchErr } = await supabase
      .from('questions')
      .select('*')
      .eq('bank_id', bank_id)
      .is('survey_id', null);

    if (fetchErr) {
      return errorResponse(res, 400, 'Failed to fetch questions from bank: ' + fetchErr.message);
    }

    if (!bankQuestions || bankQuestions.length === 0) {
      return errorResponse(res, 404, 'No questions found in specified question bank');
    }

    // Map questions to duplicate under survey_id
    const surveyQuestions = bankQuestions.map(q => ({
      survey_id,
      bank_id,
      question_text: q.question_text,
      question_type: q.question_type,
      points: q.points,
      is_required: q.is_required,
      options: q.options,
      correct_answer: q.correct_answer
    }));

    const { data, error } = await supabase
      .from('questions')
      .insert(surveyQuestions)
      .select();

    if (error) return errorResponse(res, 400, error.message);

    return successResponse(res, 201, `Imported ${data.length} questions into survey successfully`, data);
  } catch (err) {
    return errorResponse(res, 500, 'Failed to import questions to survey', err.message);
  }
};

// Submit Survey Responses (Public or Authenticated)
const submitResponse = async (req, res) => {
  try {
    const { survey_id, answers } = req.body; // answers = [{ question_id, response_text }]
    const userId = req.user ? req.user.id : null;

    if (!survey_id || !answers || !Array.isArray(answers)) {
      return errorResponse(res, 400, 'survey_id and an array of answers are required');
    }

    // Create Response Record
    const { data: responseRecord, error: respError } = await supabase
      .from('survey_responses')
      .insert([{ survey_id, user_id: userId, status: 'completed' }])
      .select()
      .single();

    if (respError) return errorResponse(res, 400, respError.message);

    // Format Answer Details
    const answerDetails = answers.map(a => ({
      response_id: responseRecord.id,
      question_id: a.question_id,
      response_text: typeof a.response_text === 'object' ? JSON.stringify(a.response_text) : String(a.response_text)
    }));

    const { error: detailError } = await supabase
      .from('response_details')
      .insert(answerDetails);

    if (detailError) return errorResponse(res, 400, detailError.message);

    return successResponse(res, 201, 'Survey submitted successfully', { response_id: responseRecord.id });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to submit survey response', err.message);
  }
};

// Execute Database Stored Procedure: fn_get_survey_analytics
const getSurveyAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    // Trigger RPC Stored Procedure in Supabase
    const { data, error } = await supabase.rpc('fn_get_survey_analytics', {
      p_survey_id: id
    });

    if (error) return errorResponse(res, 400, error.message);

    return successResponse(res, 200, 'Survey analytics calculated successfully', data);
  } catch (err) {
    return errorResponse(res, 500, 'Failed to execute analytics stored procedure', err.message);
  }
};

module.exports = {
  createSurvey,
  addQuestionsFromBank,
  submitResponse,
  getSurveyAnalytics
};