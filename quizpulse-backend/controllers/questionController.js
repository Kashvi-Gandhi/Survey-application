// const { supabase } = require('../config/supabase');
// const { successResponse, errorResponse } = require('../utils/responseFormatter');

// const createQuestion = async (req, res) => {
//   try {
//     const {
//       bank_id,
//       survey_id,
//       question_text,
//       question_type,
//       points,
//       is_required,
//       options,
//       correct_answer
//     } = req.body;

//     if (!question_text || !question_type) {
//       return errorResponse(res, 400, 'Question text and question type are required');
//     }

//     // Sanitize UUIDs so empty strings don't crash PostgreSQL
//     const cleanBankId = bank_id && bank_id.trim() !== '' ? bank_id : null;
//     const cleanSurveyId = survey_id && survey_id.trim() !== '' ? survey_id : null;

//     // Call stored procedure via Supabase RPC
//     const { data, error } = await supabase.rpc('usp_addquestion', {
//       p_bank_id: cleanBankId,
//       p_survey_id: cleanSurveyId,
//       p_question_text: question_text,
//       p_question_type: question_type,
//       p_points: points ? parseInt(points, 10) : 1,
//       p_is_required: is_required !== undefined ? Boolean(is_required) : true,
//       p_options: options ? options : [],
//       p_correct_answer: correct_answer ? correct_answer : null
//     });

//     if (error) {
//       console.error('❌ Supabase RPC Error (createQuestion):', error);
//       return errorResponse(res, 400, error.message);
//     }

//     return successResponse(res, 201, 'Question created successfully', data);
//   } catch (err) {
//     console.error('❌ createQuestion Exception:', err);
//     return errorResponse(res, 500, 'Failed to create question', err.message);
//   }
// };

// module.exports = { createQuestion };











const { poolPromise, sql } = require('../config/db');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

const parseSqlJson = (result) => {
  if (!result || !result.recordset || result.recordset.length === 0) return null;
  const rawJson = Object.values(result.recordset[0])[0];
  if (!rawJson) return null;
  return typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
};

const createQuestion = async (req, res) => {
  try {
    const { bank_id, question_text, question_type, options } = req.body;
    const userId = req.user?.id || req.user?.user_id || null;

    const pool = await poolPromise;
    const result = await pool.request()
      .input('bank_id', sql.NVarChar(100), bank_id)
      .input('question_text', sql.NVarChar(sql.MAX), question_text)
      .input('question_type', sql.NVarChar(50), question_type || 'multiple_choice')
      .input('options', sql.NVarChar(sql.MAX), typeof options === 'object' ? JSON.stringify(options) : options)
      .input('created_by', sql.NVarChar(100), userId)
      .execute('quiz.usp_addquestion');

    return res.status(201).json({
      success: true,
      message: 'Question added successfully',
      data: result.recordset[0]
    });

  } catch (err) {
    console.error('❌ Controller Exception (createQuestion):', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to add question',
      error: err.message
    });
  }
};

const createQuestionsBatch = async (req, res) => {
  try {
    const { survey_id = null, questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'questions must be a non-empty array' });
    }
    if (questions.some((question) => !question?.question_text?.trim() || !question?.question_type)) {
      return res.status(400).json({ success: false, message: 'Every question requires question_text and question_type' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('p_survey_id', sql.UniqueIdentifier, survey_id || null)
      .input('p_questions_json', sql.NVarChar(sql.MAX), JSON.stringify(questions))
      .execute('quiz.usp_batch_create_questions');

    return res.status(201).json({
      success: true,
      message: `${questions.length} question(s) created successfully`,
      data: result.recordset || []
    });
  } catch (err) {
    console.error('Batch question creation failed:', err);
    return res.status(500).json({ success: false, message: 'Failed to create questions', error: err.message });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('p_question_id', sql.UniqueIdentifier, req.params.id)
      .execute('quiz.usp_delete_question');

    return res.status(200).json({ success: true, message: 'Question deleted successfully' });
  } catch (err) {
    console.error('Question deletion failed:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete question', error: err.message });
  }
};

module.exports = { createQuestion, createQuestionsBatch, deleteQuestion };
