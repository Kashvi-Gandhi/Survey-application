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
    const pool = await poolPromise;
    const userId = req.user?.id || req.user?.user_id || null;

    // Use 'user_id' instead of 'p_user_id'
    const result = await pool.request()
      .input('user_id', sql.NVarChar(100), userId)
      .execute('quiz.usp_getusersurveys');

    const responseCounts = await pool.request()
      .query('SELECT survey_id, COUNT(*) AS response_count FROM quiz.responses GROUP BY survey_id');
    const countsBySurveyId = new Map(responseCounts.recordset.map((row) => [String(row.survey_id), Number(row.response_count)]));
    const surveys = result.recordset.map((survey) => {
      const responseCount = countsBySurveyId.get(String(survey.id)) || 0;
      return { ...survey, response_count: responseCount, has_responses: responseCount > 0 };
    });

    return res.status(200).json({
      success: true,
      data: surveys
    });

  } catch (err) {
    console.error('❌ Exception in getSurveys:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch surveys',
      error: err.message
    });
  }
};

// Get a single survey with its questions
const getSurveyById = async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await poolPromise;
    const result = await pool.request()
      .input('p_survey_id', sql.UniqueIdentifier, id)
      .execute('quiz.usp_getsurveybyid');

    // Extract raw SQL result string
    const rawRecord = result.recordset?.[0];
    let surveyData = null;

    if (rawRecord) {
      const rawJson = Object.values(rawRecord)[0];
      surveyData = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
    }

    if (!surveyData) {
      return res.status(404).json({ success: false, message: 'Survey not found' });
    }

    // Ensure questions is parsed as an array if returned as string
    if (typeof surveyData.questions_json === 'string') {
      surveyData.questions = JSON.parse(surveyData.questions_json);
    } else {
      surveyData.questions = surveyData.questions || [];
    }

    const responseCountResult = await pool.request()
      .input('p_survey_id', sql.UniqueIdentifier, id)
      .query('SELECT COUNT(*) AS response_count FROM quiz.responses WHERE survey_id = @p_survey_id');
    surveyData.response_count = Number(responseCountResult.recordset[0]?.response_count || 0);
    surveyData.has_responses = surveyData.response_count > 0;

    return res.status(200).json({
      success: true,
      data: surveyData
    });

  } catch (err) {
    console.error('❌ Exception in getSurveyById:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch survey',
      error: err.message
    });
  }
};

const updateSurvey = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, questions } = req.body;
    if (!title?.trim()) return errorResponse(res, 400, 'Survey title is required');

    // Omit `questions` to update metadata only.  Supplying it (including an
    // empty array) requests a structural synchronization.
    if (questions !== undefined && !Array.isArray(questions)) {
      return errorResponse(res, 400, 'questions must be an array when supplied.');
    }
    if (questions?.some((question) => !question?.question_text?.trim() || !question?.question_type)) {
      return errorResponse(res, 400, 'Every question requires question_text and question_type.');
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('p_survey_id', sql.UniqueIdentifier, id)
      .input('p_title', sql.NVarChar(255), title.trim())
      .input('p_description', sql.NVarChar(sql.MAX), description?.trim() || null)
      .input('p_questions_json', sql.NVarChar(sql.MAX), questions === undefined ? null : JSON.stringify(questions))
      .execute('quiz.usp_update_survey');

    return successResponse(res, 200, 'Survey updated successfully', result.recordset?.[0] || null);
  } catch (err) {
    if (err.number === 50002 || err.message?.includes('Cannot modify questions on a survey with existing responses.')) {
      return errorResponse(res, 400, 'Cannot modify questions on a survey with existing responses.');
    }
    console.error('Exception in updateSurvey:', err);
    return errorResponse(res, 500, 'Failed to update survey', err.message);
  }
};

const deleteSurvey = async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('p_survey_id', sql.UniqueIdentifier, req.params.id)
      .input('p_created_by', sql.NVarChar(100), req.user?.id || req.user?.user_id || null)
      .execute('quiz.usp_delete_survey');

    return successResponse(res, 200, 'Survey deleted successfully');
  } catch (err) {
    if (err.number === 50004 || err.message?.includes('not found or you do not have permission')) {
      return errorResponse(res, 403, 'You can only delete surveys you created.');
    }
    console.error('Exception in deleteSurvey:', err);
    return errorResponse(res, 500, 'Failed to delete survey', err.message);
  }
};

// Create a new Survey via Stored Procedure
const createSurvey = async (req, res) => {
  try {
    const { title, description } = req.body;
    const userId = req.user?.id || req.user?.user_id || null;

    if (!title) {
      return errorResponse(res, 400, 'Survey title is required');
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('p_title', sql.NVarChar(255), title)
      .input('p_description', sql.NVarChar(sql.MAX), description || null)
      .input('p_created_by', sql.NVarChar(100), userId) // Updated to NVarChar
      .execute('quiz.usp_createsurvey');

    // Handle string or object recordsets
    const rawData = result.recordset?.[0];
    const data = rawData?.id ? rawData : parseSqlJson(result);

    return res.status(201).json({
      success: true,
      message: 'Survey created successfully',
      data: data
    });

  } catch (err) {
    console.error('❌ Exception in createSurvey:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create survey',
      error: err.message
    });
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
      .execute('quiz.usp_importbanktoassessment');

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
      .execute('quiz.usp_importbanktoassessment');

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
      .execute('quiz.usp_submit_question_responses');

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
      .execute('quiz.usp_getSurveyAnalytics');

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
  updateSurvey,
  deleteSurvey,
  addQuestionsFromBank,
  importSelectedQuestions,
  submitResponse,
  getSurveyAnalytics
};
