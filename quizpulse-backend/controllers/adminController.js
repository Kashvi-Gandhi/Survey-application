const { poolPromise, sql } = require('../config/db');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

const getMetrics = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().execute('quiz.usp_admin_get_metrics');
    return successResponse(res, 200, 'Admin metrics retrieved successfully', result.recordset?.[0] || {});
  } catch (err) {
    console.error('Admin metrics error:', err);
    return errorResponse(res, 500, 'Failed to retrieve admin metrics', err.message);
  }
};

const getAllSurveyors = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().execute('quiz.usp_admin_get_all_surveyors');
    return successResponse(res, 200, 'Surveyors retrieved successfully', result.recordset || []);
  } catch (err) {
    console.error('Admin surveyors error:', err);
    return errorResponse(res, 500, 'Failed to retrieve surveyors', err.message);
  }
};

const toggleSurveyorStatus = async (req, res) => {
  try {
    const { is_active } = req.body;
    if (typeof is_active !== 'boolean') {
      return errorResponse(res, 400, 'is_active must be a boolean');
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('p_user_id', sql.UniqueIdentifier, req.params.id)
      .input('p_is_active', sql.Bit, is_active)
      .execute('quiz.usp_admin_toggle_user_status');

    // Procedures use SET NOCOUNT ON; the OUTPUT recordset is the reliable success signal.
    if (!result.recordset?.[0]) {
      return errorResponse(res, 404, 'Surveyor not found');
    }
    return successResponse(res, 200, 'Surveyor status updated successfully', result.recordset?.[0] || null);
  } catch (err) {
    console.error('Admin surveyor status error:', err);
    return errorResponse(res, 500, 'Failed to update surveyor status', err.message);
  }
};

const getSystemSurveys = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().execute('quiz.usp_admin_get_system_surveys');
    return successResponse(res, 200, 'System surveys retrieved successfully', result.recordset || []);
  } catch (err) {
    console.error('Admin system surveys error:', err);
    return errorResponse(res, 500, 'Failed to retrieve system surveys', err.message);
  }
};

const updateSystemSurveyStatus = async (req, res) => {
  try {
    const status = String(req.body?.status || '').toUpperCase();
    if (!['DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED'].includes(status)) {
      return errorResponse(res, 400, 'status must be DRAFT, ACTIVE, CLOSED, or ARCHIVED');
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('p_survey_id', sql.UniqueIdentifier, req.params.id)
      .input('p_status', sql.NVarChar(20), status)
      .execute('quiz.usp_admin_update_survey_status');

    // SET NOCOUNT ON means rowsAffected may be zero even when UPDATE ... OUTPUT succeeded.
    if (!result.recordset?.[0]) return errorResponse(res, 404, 'Survey not found');
    return successResponse(res, 200, 'Survey status updated successfully', result.recordset?.[0] || null);
  } catch (err) {
    console.error('Admin survey status error:', err);
    return errorResponse(res, 500, 'Failed to update survey status', err.message);
  }
};

const updateSystemSurvey = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title?.trim()) return errorResponse(res, 400, 'Survey title is required');
    const pool = await poolPromise;
    const result = await pool.request()
      .input('p_survey_id', sql.UniqueIdentifier, req.params.id)
      .input('p_title', sql.NVarChar(255), title.trim())
      .input('p_description', sql.NVarChar(sql.MAX), description?.trim() || null)
      .execute('quiz.usp_update_survey');
    return successResponse(res, 200, 'Survey updated successfully', result.recordset?.[0] || null);
  } catch (err) {
    if (err.number === 50002 || err.message?.includes('already has responses')) {
      return errorResponse(res, 400, 'Cannot edit a survey that already has responses.');
    }
    console.error('Admin survey update error:', err);
    return errorResponse(res, 500, 'Failed to update survey', err.message);
  }
};

const validateBank = (body) => {
  if (!body.title?.trim()) return 'Question bank title is required';
  if (body.questions !== undefined && !Array.isArray(body.questions)) return 'questions must be an array';
  if (body.questions?.some((q) => !q?.question_text?.trim() || !q?.question_type)) return 'Every question requires question_text and question_type';
  return null;
};

const manageMasterQuestionBank = async (req, res, action) => {
  const validationError = action === 'READ' || action === 'DELETE' ? null : validateBank(req.body);
  if (validationError) return errorResponse(res, 400, validationError);
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('p_action', sql.NVarChar(10), action)
      .input('p_bank_id', sql.UniqueIdentifier, req.params.id || null)
      .input('p_title', sql.NVarChar(255), req.body?.title?.trim() || null)
      .input('p_category', sql.NVarChar(100), req.body?.category?.trim() || null)
      .input('p_description', sql.NVarChar(sql.MAX), req.body?.description?.trim() || null)
      .input('p_questions_json', sql.NVarChar(sql.MAX), req.body?.questions === undefined ? null : JSON.stringify(req.body.questions))
      .input('p_created_by', sql.UniqueIdentifier, req.user.id)
      .execute('quiz.usp_admin_manage_question_banks');
    return successResponse(res, action === 'CREATE' ? 201 : 200, `Master question bank ${action.toLowerCase()}d successfully`, result.recordset || []);
  } catch (err) {
    if (err.number === 50021 || err.number === 50022) return errorResponse(res, 404, err.message);
    console.error(`Admin master bank ${action} error:`, err);
    return errorResponse(res, 500, `Failed to ${action.toLowerCase()} master question bank`, err.message);
  }
};

const getMasterQuestionBanks = (req, res) => manageMasterQuestionBank(req, res, 'READ');
const createMasterQuestionBank = (req, res) => manageMasterQuestionBank(req, res, 'CREATE');
const updateMasterQuestionBank = (req, res) => manageMasterQuestionBank(req, res, 'UPDATE');
const deleteMasterQuestionBank = (req, res) => manageMasterQuestionBank(req, res, 'DELETE');

module.exports = {
  getMetrics,
  getAllSurveyors,
  toggleSurveyorStatus,
  getSystemSurveys,
  updateSystemSurveyStatus,
  updateSystemSurvey,
  getMasterQuestionBanks,
  createMasterQuestionBank,
  updateMasterQuestionBank,
  deleteMasterQuestionBank
};
