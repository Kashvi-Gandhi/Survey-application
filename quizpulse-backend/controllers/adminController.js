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

    if (!result.rowsAffected?.[0]) {
      return errorResponse(res, 404, 'Surveyor not found');
    }
    return successResponse(res, 200, 'Surveyor status updated successfully', result.recordset?.[0] || null);
  } catch (err) {
    console.error('Admin surveyor status error:', err);
    return errorResponse(res, 500, 'Failed to update surveyor status', err.message);
  }
};

module.exports = { getMetrics, getAllSurveyors, toggleSurveyorStatus };
