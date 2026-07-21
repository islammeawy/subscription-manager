const errorMiddleware = (err, req, res, next) => {

  try {
  let error = { ...err };
  error.message = err.message;

  // Log the error for debugging purposes
  console.error(err);
  
  // Handle Mongoose validation errors
  if  (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    error.message = messages.join(', ');
    error.statusCode = 400;
  }
  
  // handle mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error.message = `Duplicate value for field: ${field}`;
    error.statusCode = 400;
  }

  // Handle Mongoose cast errors (bad  ObjectId)
  if (err.name === 'CastError') {
    error.message = `Resource not found with id of ${err.value}`;
    error.statusCode = 404;
  }


  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token. Please log in again.';
    error.statusCode = 401;
  }
   
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
}
catch (error) {
  console.error('Error in errorMiddleware:', error);
  error.message = 'An unexpected error occurred';
  error.statusCode = 500;
  next(error);

}
}

export default errorMiddleware;
