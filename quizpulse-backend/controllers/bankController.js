// const { supabase } = require('../config/supabase');
// const { successResponse, errorResponse } = require('../utils/responseFormatter');

// // Create a new Question Bank via Stored Procedure
// const createBank = async (req, res) => {
//   try {
//     const { title, description } = req.body;
//     const userId = req.user?.id; // Check if req.user exists

//     if (!title) {
//       return errorResponse(res, 400, 'Question bank title is required');
//     }

//     // Call stored procedure
//     const { data, error } = await supabase.rpc('usp_createquestionbank', {
//       p_title: title,
//       p_description: description || null,
//       p_created_by: userId || null
//     });

//     if (error) {
//       // 🚨 THIS WILL PRINT THE REAL POSTGRES ERROR IN YOUR BACKEND TERMINAL
//       console.error('❌ Supabase RPC Error:', error);
//       return errorResponse(res, 400, error.message);
//     }

//     return successResponse(res, 201, 'Question bank created successfully', data);
//   } catch (err) {
//     console.error('❌ Controller Exception:', err);
//     return errorResponse(res, 500, 'Failed to create question bank', err.message);
//   }
// };

// // Get all Question Banks for current user
// const getBanks = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     // Fetch banks using database function
//     const { data: banks, error: banksError } = await supabase.rpc('usp_getuserquestionbanks', {
//       p_user_id: userId
//     });

//     if (banksError) return errorResponse(res, 400, banksError.message);

//     return successResponse(res, 200, 'Question banks retrieved successfully', banks || []);
//   } catch (err) {
//     return errorResponse(res, 500, 'Failed to fetch question banks', err.message);
//   }
// };

// module.exports = { createBank, getBanks };








const { poolPromise, sql } = require('../config/db');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

// Helper to safely parse FOR JSON PATH results from SSMS
const parseSqlJson = (result) => {
  if (!result || !result.recordset || result.recordset.length === 0) return null;
  const rawJson = Object.values(result.recordset[0])[0];
  if (!rawJson) return null;
  return typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
};

// Create a new Question Bank via Stored Procedure
const createBank = async (req, res) => {
  try {
    const { title, description } = req.body;
    const userId = req.user?.id;

    if (!title) {
      return errorResponse(res, 400, 'Question bank title is required');
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('p_title', sql.NVarChar(255), title)
      .input('p_description', sql.NVarChar(sql.MAX), description || null)
      .input('p_created_by', sql.UniqueIdentifier, userId || null)
      .execute('usp_createquestionbank');

    const data = parseSqlJson(result);
    return successResponse(res, 201, 'Question bank created successfully', data);

  } catch (err) {
    console.error('❌ Controller Exception (createBank):', err);
    return errorResponse(res, 500, 'Failed to create question bank', err.message);
  }
};

// Get all Question Banks for current user
const getBanks = async (req, res) => {
  try {
    const userId = req.user?.id;

    const pool = await poolPromise;
    const result = await pool.request()
      .input('p_user_id', sql.UniqueIdentifier, userId)
      .execute('usp_getuserquestionbanks');

    const data = parseSqlJson(result) || [];
    return successResponse(res, 200, 'Question banks retrieved successfully', data);

  } catch (err) {
    console.error('❌ Controller Exception (getBanks):', err);
    return errorResponse(res, 500, 'Failed to fetch question banks', err.message);
  }
};

module.exports = { createBank, getBanks };