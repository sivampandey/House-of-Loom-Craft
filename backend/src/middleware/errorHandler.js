export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  // Handle Mongoose duplicate key error (e.g. unique email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `An account with this ${field} already exists in our atelier records.`
    });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: messages.join('. ')
    });
  }

  // Handle CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Resource not found with id ${err.value}`
    });
  }

  // Generic sanitized error response
  const isProduction = process.env.NODE_ENV === 'production';
  const responseMessage = isProduction && statusCode === 500
    ? 'An unexpected atelier service error occurred. Please try again or contact the concierge.'
    : (err.message || 'An unexpected atelier server error occurred. Please try again.');

  res.status(statusCode).json({
    success: false,
    message: responseMessage,
    ...(!isProduction ? { stack: err.stack } : {})
  });
};
