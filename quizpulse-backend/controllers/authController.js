const { supabase } = require('../config/supabase');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

// Register a new user
const registerUser = async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password || !full_name) {
      return errorResponse(res, 400, 'Email, password, and full name are required');
    }

    // Supabase Auth Signup (Triggers database trigger on_auth_user_created automatically)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name }
      }
    });

    if (error) {
      return errorResponse(res, 400, error.message);
    }

    return successResponse(res, 201, 'User registered successfully', {
      user_id: data.user?.id,
      email: data.user?.email
    });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to register user', err.message);
  }
};

// Login User & acquire Access Token
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 400, 'Email and password are required');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return errorResponse(res, 401, 'Invalid login credentials');
    }

    // Retrieve full profile details
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, role_master(role_name)')
      .eq('id', data.user.id)
      .single();

    return successResponse(res, 200, 'Login successful', {
      token: data.session.access_token,
      user: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role_master?.role_name
      }
    });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to authenticate user', err.message);
  }
};

// Get current logged-in user profile
const getProfile = async (req, res) => {
  return successResponse(res, 200, 'Profile retrieved successfully', {
    user: req.user
  });
};

module.exports = {
  registerUser,
  loginUser,
  getProfile
};