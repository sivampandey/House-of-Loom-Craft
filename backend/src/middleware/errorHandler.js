export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  // Handle Mongoose duplicate key error (e.g. unique email, slug, coupon code)
  if (err.code === 11000) {
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'field';
    let userMsg = `A record with this ${field} already exists.`;
    if (field === 'email') userMsg = 'An account with this email address already exists. Please log in.';
    else if (field === 'slug') userMsg = 'A product with this URL slug already exists in atelier records.';
    else if (field === 'orderNumber') userMsg = 'Order reference conflict. Please retry your order.';
    else if (field === 'code') userMsg = 'A coupon offer with this promotional code already exists.';
    else if (field === 'razorpayOrderId' || field === 'razorpayPaymentId') userMsg = 'This payment has already been verified and processed.';

    return res.status(409).json({
      success: false,
      message: userMsg
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
