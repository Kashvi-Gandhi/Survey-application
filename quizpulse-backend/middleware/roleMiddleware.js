// const { errorResponse } = require('../utils/responseFormatter');

// const authorizeRoles = (...allowedRoles) => {
//   return (req, res, next) => {
//     if (!req.role) {
//       return errorResponse(res, 401, 'Unauthorized: User role undefined');
//     }

//     if (!allowedRoles.includes(req.role)) {
//       return errorResponse(
//         res, 
//         403, 
//         `Forbidden: Role '${req.role}' does not have access to this resource`
//       );
//     }

//     next();
//   };
// };

// module.exports = authorizeRoles;









const { errorResponse } = require('../utils/responseFormatter');

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return errorResponse(res, 403, 'Forbidden: User role not found');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, 403, 'Forbidden: You do not have permission for this action');
    }

    next();
  };
};

module.exports = authorizeRoles;