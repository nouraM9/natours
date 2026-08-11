class AppError extends Error {
  constructor(message, statusCode) {
    //we have to call message because its the only parametet error class constructor expects
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'; // Fixed status setting
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
module.exports = AppError;
