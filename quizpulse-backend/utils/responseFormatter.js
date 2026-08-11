/**
 * Standardized API response structure
 */
const successResponse = (res, statusCode, message, data = null) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data
  });
};

const errorResponse = (res, statusCode, message, error = null) => {
  return res.status(statusCode).json({
    status: 'error',
    message,
    error: error ? error : null
  });
};

module.exports = {
  successResponse,
  errorResponse
};