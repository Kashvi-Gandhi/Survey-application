// const { supabase } = require('../config/supabase');
// const { errorResponse } = require('../utils/responseFormatter');

// const authenticateUser = async (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return errorResponse(res, 401, 'Unauthorized: Access token missing or invalid format');
//     }

//     const token = authHeader.split(' ')[1];

//     // Verify token with Supabase
//     const { data: { user }, error } = await supabase.auth.getUser(token);

//     if (error || !user) {
//       return errorResponse(res, 401, 'Unauthorized: Invalid or expired token');
//     }

//     // Fetch user profile along with role_name from DB
//     const { data: profile, error: profileError } = await supabase
//       .from('profiles')
//       .select('*, role_master(role_name)')
//       .eq('id', user.id)
//       .single();

//     if (profileError || !profile) {
//       return errorResponse(res, 404, 'User profile not found in system');
//     }

//     if (!profile.is_active) {
//       return errorResponse(res, 403, 'Account deactivated. Please contact an administrator.');
//     }

//     // Attach profile and role to req object for subsequent controllers
//     req.user = profile;
//     req.role = profile.role_master?.role_name;

//     next();
//   } catch (err) {
//     return errorResponse(res, 500, 'Internal Server Error during authentication', err.message);
//   }
// };

// module.exports = authenticateUser;














const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/responseFormatter');

const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 401, 'Access denied. No token provided.');
    }

    // Extract token after "Bearer "
    const token = authHeader.split(' ')[1];

    if (!token) {
      return errorResponse(res, 401, 'Access denied. Token missing.');
    }

    // Verify token using secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_fallback_secret');

    // Attach decoded user info to request (e.g. { id, email, role })
    req.user = {
      id: decoded.id || decoded.sub, // Ensures req.user.id is accessible
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 401, 'Token has expired. Please log in again.');
    }
    return errorResponse(res, 401, 'Invalid authentication token.');
  }
};

module.exports = authenticateUser;