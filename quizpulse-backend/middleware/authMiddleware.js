const { supabase } = require('../config/supabase');
const { errorResponse } = require('../utils/responseFormatter');

const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 401, 'Unauthorized: Access token missing or invalid format');
    }

    const token = authHeader.split(' ')[1];

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return errorResponse(res, 401, 'Unauthorized: Invalid or expired token');
    }

    // Fetch user profile along with role_name from DB
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, role_master(role_name)')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return errorResponse(res, 404, 'User profile not found in system');
    }

    if (!profile.is_active) {
      return errorResponse(res, 403, 'Account deactivated. Please contact an administrator.');
    }

    // Attach profile and role to req object for subsequent controllers
    req.user = profile;
    req.role = profile.role_master?.role_name;

    next();
  } catch (err) {
    return errorResponse(res, 500, 'Internal Server Error during authentication', err.message);
  }
};

module.exports = authenticateUser;