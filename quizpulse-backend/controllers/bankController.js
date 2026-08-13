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
    const { name, title, bank_name, description } = req.body;
    const finalName = name || bank_name || title;
    const userId = req.user?.id || req.user?.user_id || null;

    if (!finalName) {
      return res.status(400).json({ success: false, message: 'Bank name is required' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('name', sql.NVarChar(255), finalName)
      .input('description', sql.NVarChar(sql.MAX), description || '')
      .input('created_by', sql.NVarChar(100), userId)
      .execute('usp_createquestionbank');

    return res.status(201).json({
      success: true,
      message: 'Question bank created successfully',
      data: result.recordset[0]
    });

  } catch (err) {
    console.error('❌ Controller Exception (createBank):', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create question bank',
      error: err.message
    });
  }
};

// Get all Question Banks for current user
const getBanks = async (req, res) => {
  try {
    const pool = await poolPromise;
    const userId = req.user?.id || req.user?.user_id || null;

    const result = await pool.request()
      .input('user_id', sql.NVarChar(100), userId)
      .execute('usp_getuserquestionbanks');

    return res.status(200).json({
      success: true,
      data: result.recordset
    });

  } catch (err) {
    console.error('❌ Controller Exception (getBanks):', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch question banks',
      error: err.message
    });
  }
};

module.exports = { createBank, getBanks };