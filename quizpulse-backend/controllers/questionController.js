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

    if (!question_text || !question_type) {
      return errorResponse(res, 400, 'Question text and question type are required');
    }

    const cleanBankId = bank_id && String(bank_id).trim() !== '' ? bank_id : null;
    const cleanSurveyId = survey_id && String(survey_id).trim() !== '' ? survey_id : null;

    const pool = await poolPromise;
    const result = await pool.request()
      .input('p_bank_id', sql.UniqueIdentifier, cleanBankId)
      .input('p_survey_id', sql.UniqueIdentifier, cleanSurveyId)
      .input('p_question_text', sql.NVarChar(sql.MAX), question_text)
      .input('p_question_type', sql.NVarChar(50), question_type)
      .input('p_points', sql.Int, points ? parseInt(points, 10) : 1)
      .input('p_is_required', sql.Bit, is_required !== undefined ? Boolean(is_required) : true)
      .input('p_options', sql.NVarChar(sql.MAX), options ? JSON.stringify(options) : '[]')
      .input('p_correct_answer', sql.NVarChar(sql.MAX), correct_answer ? JSON.stringify(correct_answer) : null)
      .execute('usp_addquestion');

    const data = parseSqlJson(result);
    return successResponse(res, 201, 'Question created successfully', data);

  } catch (err) {
    console.error('❌ Controller Exception (createQuestion):', err);
    return errorResponse(res, 500, 'Failed to create question', err.message);
  }
};

module.exports = { createQuestion };