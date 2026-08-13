// const { supabase } = require('../config/supabase');
// const { successResponse, errorResponse } = require('../utils/responseFormatter');

// // Register a new user
// const registerUser = async (req, res) => {
//   try {
//     const { email, password, full_name } = req.body;

//     if (!email || !password || !full_name) {
//       return errorResponse(res, 400, 'Email, password, and full name are required');
//     }

//     // Supabase Auth Signup (Triggers database trigger on_auth_user_created automatically)
//     const { data, error } = await supabase.auth.signUp({
//       email,
//       password,
//       options: {
//         data: { full_name }
//       }
//     });

//     if (error) {
//       return errorResponse(res, 400, error.message);
//     }

//     return successResponse(res, 201, 'User registered successfully', {
//       user_id: data.user?.id,
//       email: data.user?.email
//     });
//   } catch (err) {
//     return errorResponse(res, 500, 'Failed to register user', err.message);
//   }
// };

// // Login User & acquire Access Token
// const loginUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return errorResponse(res, 400, 'Email and password are required');
//     }

//     const { data, error } = await supabase.auth.signInWithPassword({
//       email,
//       password
//     });

//     if (error) {
//       return errorResponse(res, 401, 'Invalid login credentials');
//     }

//     // Retrieve full profile details
//     const { data: profile } = await supabase
//       .from('profiles')
//       .select('*, role_master(role_name)')
//       .eq('id', data.user.id)
//       .single();

//     return successResponse(res, 200, 'Login successful', {
//       token: data.session.access_token,
//       user: {
//         id: profile.id,
//         email: profile.email,
//         full_name: profile.full_name,
//         role: profile.role_master?.role_name
//       }
//     });
//   } catch (err) {
//     return errorResponse(res, 500, 'Failed to authenticate user', err.message);
//   }
// };

// // Get current logged-in user profile
// const getProfile = async (req, res) => {
//   return successResponse(res, 200, 'Profile retrieved successfully', {
//     user: req.user
//   });
// };

// module.exports = {
//   registerUser,
//   loginUser,
//   getProfile
// };















// controllers/authController.js
const { poolPromise, sql } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const successResponse = (res, statusCode, message, data = {}) => {
  return res.status(statusCode).json({ success: true, message, data });
};

const errorResponse = (res, statusCode, message, error = null) => {
  return res.status(statusCode).json({ success: false, message, error });
};

// 1. REGISTER USER
const registerUser = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const full_name = req.body.full_name || req.body.fullName || req.body.name;
    const roleInput = req.body.role || 'surveyor'; 

    if (!email || !full_name || !password) {
      return errorResponse(res, 400, 'Email, full name, and password are required');
    }

    const pool = await poolPromise;

    // A. Check if user already exists
    const checkUser = await pool.request()
      .input('p_email', sql.NVarChar(255), email)
      .query('SELECT id FROM quiz.profiles WHERE email = @p_email');

    if (checkUser.recordset.length > 0) {
      return errorResponse(res, 400, 'User with this email already exists');
    }

    // B. Fetch role ID from quiz.role_master using 'id' (NOT role_id)
    let roleId;
    const roleResult = await pool.request()
      .input('p_role_name', sql.NVarChar(50), roleInput)
      .query(`
        SELECT id FROM quiz.role_master 
        WHERE LOWER(role_name) LIKE '%' + LOWER(@p_role_name) + '%'
      `);

    if (roleResult.recordset.length > 0) {
      roleId = roleResult.recordset[0].id;
    } else {
      // Grab ANY valid primary key from role_master if exact name search fails
      const fallbackRole = await pool.request().query('SELECT TOP 1 id FROM quiz.role_master');
      if (fallbackRole.recordset.length > 0) {
        roleId = fallbackRole.recordset[0].id;
      } else {
        return errorResponse(res, 500, 'No roles found in quiz.role_master table. Please seed roles first.');
      }
    }

    // C. Hash password & Generate UUID for user id
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const userId = crypto.randomUUID();

    // D. Insert into quiz.profiles using the valid roleId
    const insertResult = await pool.request()
      .input('p_id', sql.NVarChar(100), userId)
      .input('p_email', sql.NVarChar(255), email)
      .input('p_password_hash', sql.NVarChar(255), passwordHash)
      .input('p_full_name', sql.NVarChar(255), full_name)
      .input('p_role_id', sql.Int, roleId)
      .query(`
        INSERT INTO quiz.profiles (id, email, password_hash, full_name, role_id)
        OUTPUT INSERTED.id, INSERTED.email, INSERTED.full_name, INSERTED.role_id
        VALUES (@p_id, @p_email, @p_password_hash, @p_full_name, @p_role_id)
      `);

    const newUser = insertResult.recordset[0];

    return successResponse(res, 201, 'User registered successfully', {
      user_id: newUser.id,
      email: newUser.email,
      full_name: newUser.full_name,
      role_id: newUser.role_id
    });

  } catch (err) {
    console.error('❌ Registration Error:', err);
    return errorResponse(res, 500, 'Failed to register user', err.message);
  }
};

// 2. LOGIN USER
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 400, 'Email and password are required');
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('p_email', sql.NVarChar(255), email)
      .query(`
        SELECT p.id, p.email, p.password_hash, p.full_name, r.role_name AS role
        FROM quiz.profiles p
        LEFT JOIN quiz.role_master r ON p.role_id = r.id
        WHERE p.email = @p_email
      `);

    const user = result.recordset[0];

    if (!user) {
      return errorResponse(res, 401, 'Invalid login credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return errorResponse(res, 401, 'Invalid login credentials');
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role || 'surveyor'
      },
      process.env.JWT_SECRET || 'fallback_jwt_secret',
      { expiresIn: '24h' }
    );

    return successResponse(res, 200, 'Login successful', {
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role || 'surveyor'
      }
    });

  } catch (err) {
    console.error('❌ Login Error:', err);
    return errorResponse(res, 500, 'Failed to authenticate user', err.message);
  }
};

const getProfile = async (req, res) => {
  try {
    return successResponse(res, 200, 'Profile retrieved successfully', {
      user: req.user
    });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to retrieve profile', err.message);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getProfile
};