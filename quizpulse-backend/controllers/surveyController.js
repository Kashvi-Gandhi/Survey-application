// const { supabase } = require('../config/supabase');
// const { successResponse, errorResponse } = require('../utils/responseFormatter');

// // Debug endpoint to check responses table
// const debugResponses = async (req, res) => {
//   try {
//     const { data, error } = await supabase.rpc('usp_debugresponses');

//     if (error) {
//       return errorResponse(res, 400, `Database error: ${error.message}`);
//     }

//     return successResponse(res, 200, 'Debug info', data);
//   } catch (err) {
//     return errorResponse(res, 500, 'Debug failed', err.message);
//   }
// };

// // Get all surveys for current user via Stored Procedure
// const getSurveys = async (req, res) => {
//   try {
//     const userId = req.user?.id;

//     if (!userId) {
//       return errorResponse(res, 401, 'User authentication required');
//     }

//     // Call stored procedure via RPC
//     const { data, error } = await supabase.rpc('usp_getusersurveys', {
//       p_user_id: userId
//     });

//     if (error) {
//       console.error('❌ Supabase RPC Error (getSurveys):', error);
//       return errorResponse(res, 400, error.message);
//     }

//     return successResponse(res, 200, 'Surveys retrieved successfully', data || []);
//   } catch (err) {
//     console.error('❌ Exception in getSurveys:', err);
//     return errorResponse(res, 500, 'Failed to fetch surveys', err.message);
//   }
// };

// // Get a single survey with its questions
// const getSurveyById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const { data: surveyData, error } = await supabase.rpc('usp_getsurveybyid', {
//       p_survey_id: id
//     });

//     if (error || !surveyData) {
//       return errorResponse(res, 404, 'Survey not found');
//     }

//     return successResponse(res, 200, 'Survey retrieved successfully', surveyData);
//   } catch (err) {
//     return errorResponse(res, 500, 'Failed to fetch survey', err.message);
//   }
// };

// // Create a new Survey via Stored Procedure
// const createSurvey = async (req, res) => {
//   try {
//     const { title, description } = req.body;
//     const userId = req.user.id;

//     if (!title) {
//       return errorResponse(res, 400, 'Survey title is required');
//     }

//     const { data, error } = await supabase.rpc('usp_createsurvey', {
//       p_title: title,
//       p_description: description || null,
//       p_created_by: userId
//     });

//     if (error) return errorResponse(res, 400, error.message);

//     return successResponse(res, 201, 'Survey created successfully', data);
//   } catch (err) {
//     return errorResponse(res, 500, 'Failed to create survey', err.message);
//   }
// };

// // Copy ALL questions from Question Bank into a Survey
// const addQuestionsFromBank = async (req, res) => {
//   try {
//     const { survey_id, bank_id } = req.body;

//     if (!survey_id || !bank_id) {
//       return errorResponse(res, 400, 'survey_id and bank_id are required');
//     }

//     const { data, error } = await supabase.rpc('usp_importbanktoassessment', {
//       p_survey_id: survey_id,
//       p_bank_id: bank_id,
//       p_question_ids: null // Import all
//     });

//     if (error) return errorResponse(res, 400, error.message);

//     return successResponse(res, 201, 'Imported questions into survey successfully', data);
//   } catch (err) {
//     return errorResponse(res, 500, 'Failed to import questions to survey', err.message);
//   }
// };

// // Import SELECTED questions from a Question Bank into a Survey
// const importSelectedQuestions = async (req, res) => {
//   try {
//     const { survey_id, bank_id, question_ids } = req.body;

//     if (!survey_id || !bank_id || !question_ids || !Array.isArray(question_ids)) {
//       return errorResponse(res, 400, 'survey_id, bank_id, and question_ids array are required');
//     }

//     const { data, error } = await supabase.rpc('usp_importbanktoassessment', {
//       p_survey_id: survey_id,
//       p_bank_id: bank_id,
//       p_question_ids: question_ids
//     });

//     if (error) return errorResponse(res, 400, error.message);

//     return successResponse(res, 201, 'Imported selected questions into survey successfully', data);
//   } catch (err) {
//     return errorResponse(res, 500, 'Failed to import selected questions to survey', err.message);
//   }
// };

// // Submit Survey Responses via Stored Procedure
// const submitResponse = async (req, res) => {
//   try {
//     const { survey_id, answers, taker_name, taker_email } = req.body;
//     const userId = req.user ? req.user.id : null;

//     if (!survey_id || !answers || !Array.isArray(answers)) {
//       return errorResponse(res, 400, 'survey_id and an array of answers are required');
//     }

//     if (!userId && (!taker_name || !taker_email)) {
//       return errorResponse(res, 400, 'taker_name and taker_email are required for anonymous submissions');
//     }

//     // Pass submission array directly to the procedure
//     const { data, error } = await supabase.rpc('submit_question_responses', {
//       p_survey_id: survey_id,
//       p_respondent_id: userId,
//       p_taker_name: taker_name || null,
//       p_taker_email: taker_email || null,
//       p_answers: answers
//     });

//     if (error) return errorResponse(res, 400, error.message);

//     return successResponse(res, 201, 'Survey submitted successfully', data);
//   } catch (err) {
//     return errorResponse(res, 500, 'Failed to submit survey response', err.message);
//   }
// };

// // Fetch Analytics via Database Function
// const getSurveyAnalytics = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const { data, error } = await supabase.rpc('fn_get_survey_analytics', {
//       p_survey_id: id
//     });

//     if (error) return errorResponse(res, 400, error.message);

//     return successResponse(res, 200, 'Survey analytics calculated successfully', data);
//   } catch (err) {
//     return errorResponse(res, 500, 'Failed to execute analytics', err.message);
//   }
// };

// module.exports = {
//   debugResponses,
//   getSurveys,
//   getSurveyById,
//   createSurvey,
//   addQuestionsFromBank,
//   importSelectedQuestions,
//   submitResponse,
//   getSurveyAnalytics
// };









const { poolPromise, sql } = require('../config/db');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

const parseSqlJson = (result) => {
  if (!result || !result.recordset || result.recordset.length === 0) return null;
  const rawJson = Object.values(result.recordset[0])[0];
  if (!rawJson) return null;
  return typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
};

// Debug endpoint
const debugResponses = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT TOP 10 * FROM responses');
    return successResponse(res, 200, 'Debug info', result.recordset);
  } catch (err) {
    return errorResponse(res, 500, 'Debug failed', err.message);
  }
};

// Get all surveys for current user
const getSurveys = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return errorResponse(res, 401, 'User authentication required');
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('p_user_id', sql.UniqueIdentifier, userId)
      .execute('usp_getusersurveys');

    const data = parseSqlJson(result) || [];
    return successResponse(res, 200, 'Surveys retrieved successfully', data);

  } catch (err) {
    console.error('❌ Exception in getSurveys:', err);
    return errorResponse(res, 500, 'Failed to fetch surveys', err.message);
  }
};

// Get a single survey with its questions
const getSurveyById = async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await poolPromise;
    const result = await pool.request()
      .input('p_survey_id', sql.UniqueIdentifier, id)
      .execute('usp_getsurveybyid');

    const surveyData = parseSqlJson(result);

    if (!surveyData) {
      return errorResponse(res, 404, 'Survey not found');
    }

    return successResponse(res, 200, 'Survey retrieved successfully', surveyData);
  } catch (err) {
    console.error('❌ Exception in getSurveyById:', err);
    return errorResponse(res, 500, 'Failed to fetch survey', err.message);
  }
};

// Create a new Survey via Stored Procedure
const createSurvey = async (req, res) => {
  try {
    const { title, description } = req.body;
    const userId = req.user?.id;

    if (!title) {
      return errorResponse(res, 400, 'Survey title is required');
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('p_title', sql.NVarChar(255), title)
      .input('p_description', sql.NVarChar(sql.MAX), description || null)
      .input('p_created_by', sql.UniqueIdentifier, userId || null)
      .execute('usp_createsurvey');

    const data = parseSqlJson(result);
    return successResponse(res, 201, 'Survey created successfully', data);

  } catch (err) {
    console.error('❌ Exception in createSurvey:', err);
    return errorResponse(res, 500, 'Failed to create survey', err.message);
  }
};

// Copy ALL questions from Question Bank into a Survey
const addQuestionsFromBank = async (req, res) => {
  try {
    const { survey_id, bank_id } = req.body;

    if (!survey_id || !bank_id) {
      return errorResponse(res, 400, 'survey_id and bank_id are required');
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('p_survey_id', sql.UniqueIdentifier, survey_id)
      .input('p_bank_id', sql.UniqueIdentifier, bank_id)
      .input('p_question_ids', sql.NVarChar(sql.MAX), null)
      .execute('usp_importbanktoassessment');

    const data = parseSqlJson(result);
    return successResponse(res, 201, 'Imported questions into survey successfully', data);

  } catch (err) {
    console.error('❌ Exception in addQuestionsFromBank:', err);
    return errorResponse(res, 500, 'Failed to import questions to survey', err.message);
  }
};

// Import SELECTED questions from a Question Bank into a Survey
const importSelectedQuestions = async (req, res) => {
  try {
    const { survey_id, bank_id, question_ids } = req.body;

    if (!survey_id || !bank_id || !question_ids || !Array.isArray(question_ids)) {
      return errorResponse(res, 400, 'survey_id, bank_id, and question_ids array are required');
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('p_survey_id', sql.UniqueIdentifier, survey_id)
      .input('p_bank_id', sql.UniqueIdentifier, bank_id)
      .input('p_question_ids', sql.NVarChar(sql.MAX), JSON.stringify(question_ids))
      .execute('usp_importbanktoassessment');

    const data = parseSqlJson(result);
    return successResponse(res, 201, 'Imported selected questions into survey successfully', data);

  } catch (err) {
    console.error('❌ Exception in importSelectedQuestions:', err);
    return errorResponse(res, 500, 'Failed to import selected questions to survey', err.message);
  }
};

// Submit Survey Responses via Stored Procedure
const submitResponse = async (req, res) => {
  try {
    const { survey_id, answers, taker_name, taker_email } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!survey_id || !answers || !Array.isArray(answers)) {
      return errorResponse(res, 400, 'survey_id and an array of answers are required');
    }

    if (!userId && (!taker_name || !taker_email)) {
      return errorResponse(res, 400, 'taker_name and taker_email are required for anonymous submissions');
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('p_survey_id', sql.UniqueIdentifier, survey_id)
      .input('p_respondent_id', sql.UniqueIdentifier, userId || null)
      .input('p_taker_name', sql.NVarChar(255), taker_name || null)
      .input('p_taker_email', sql.NVarChar(255), taker_email || null)
      .input('p_answers', sql.NVarChar(sql.MAX), JSON.stringify(answers))
      .execute('submit_question_responses');

    const data = parseSqlJson(result);
    return successResponse(res, 201, 'Survey submitted successfully', data);

  } catch (err) {
    console.error('❌ Exception in submitResponse:', err);
    return errorResponse(res, 500, 'Failed to submit survey response', err.message);
  }
};

// Fetch Analytics
const getSurveyAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await poolPromise;
    const result = await pool.request()
      .input('p_survey_id', sql.UniqueIdentifier, id)
      .query(`
        SELECT 
          s.id AS survey_id,
          s.title,
          COUNT(DISTINCT r.respondent_id) + COUNT(DISTINCT r.taker_email) AS total_responses,
          AVG(r.score_earned) AS average_score
        FROM surveys s
        LEFT JOIN responses r ON r.survey_id = s.id
        WHERE s.id = @p_survey_id
        GROUP BY s.id, s.title
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
      `);

    const data = parseSqlJson(result);
    return successResponse(res, 200, 'Survey analytics calculated successfully', data);

  } catch (err) {
    console.error('❌ Exception in getSurveyAnalytics:', err);
    return errorResponse(res, 500, 'Failed to execute analytics', err.message);
  }
};

module.exports = {
  debugResponses,
  getSurveys,
  getSurveyById,
  createSurvey,
  addQuestionsFromBank,
  importSelectedQuestions,
  submitResponse,
  getSurveyAnalytics
};