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















const { poolPromise, sql } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

// 1. Register a new user
const registerUser = async (req, res) => {
  try {
    const { email, password, full_name, role } = req.body;

    if (!email || !password || !full_name) {
      return errorResponse(res, 400, 'Email, password, and full name are required');
    }

    const pool = await poolPromise;

    // Check if user already exists
    const checkUser = await pool.request()
      .input('p_email', sql.NVarChar(255), email)
      .query('SELECT id FROM users WHERE email = @p_email');

    if (checkUser.recordset.length > 0) {
      return errorResponse(res, 400, 'User with this email already exists');
    }

    // Hash the password securely
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user into SQL Server database
    const insertResult = await pool.request()
      .input('p_email', sql.NVarChar(255), email)
      .input('p_password_hash', sql.NVarChar(255), passwordHash)
      .input('p_full_name', sql.NVarChar(255), full_name)
      .input('p_role', sql.NVarChar(50), role || 'surveyor') // Default role
      .query(`
        INSERT INTO users (email, password_hash, full_name, role)
        OUTPUT INSERTED.id, INSERTED.email, INSERTED.full_name, INSERTED.role
        VALUES (@p_email, @p_password_hash, @p_full_name, @p_role)
      `);

    const newUser = insertResult.recordset[0];

    return successResponse(res, 201, 'User registered successfully', {
      user_id: newUser.id,
      email: newUser.email,
      full_name: newUser.full_name,
      role: newUser.role
    });

  } catch (err) {
    console.error('❌ Registration Error:', err);
    return errorResponse(res, 500, 'Failed to register user', err.message);
  }
};

// 2. Login User & acquire Access Token
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 400, 'Email and password are required');
    }

    // Fetch user details from SQL Server
    const pool = await poolPromise;
    const result = await pool.request()
      .input('p_email', sql.NVarChar(255), email)
      .query('SELECT id, email, password_hash, full_name, role FROM users WHERE email = @p_email');

    const user = result.recordset[0];

    if (!user) {
      return errorResponse(res, 401, 'Invalid login credentials');
    }

    // Compare entered password with hashed password in database
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return errorResponse(res, 401, 'Invalid login credentials');
    }

    // Generate JWT Token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'your_fallback_secret',
      { expiresIn: '24h' }
    );

    return successResponse(res, 200, 'Login successful', {
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });

  } catch (err) {
    console.error('❌ Login Error:', err);
    return errorResponse(res, 500, 'Failed to authenticate user', err.message);
  }
};

// 3. Get current logged-in user profile
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