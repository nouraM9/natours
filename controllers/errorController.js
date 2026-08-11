const AppError = require('./../utlis/appError');
const sendErrorDev = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  // RENDERED WEBSITE
  console.error('ERROR: ', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  //Opertational ,trused errors,send message to client
  //B) API
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
      //Programing or other unkown errors: dont leak error details to client
    }
    //1)Log error
    console.error('ERROR: ', err);
    //2) Send message to client
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong, please try again later',
    });
  }
  // B) RENDERED WEBSITE
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
    //Programing or other unkown errors: dont leak error details to client
  }
  //1)Log error
  console.error('ERROR: ', err);
  //2) Send message to client
  return res.status(500).json({
    title: 'Something went wrong!',
    msg: 'please try again later',
  });
};

const handleCastErrorDb = (err) => {
  const message = `Invalid ${err.path} : ${err.value}.`;
  return new AppError(message, 400);
};

const handleDublicateFieldsDb = (err) => {
  const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  // console.log(value);
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDb = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data: ${errors.join(', ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invaild Token.Please log in again.', 401);
const handleJWTExpired = () =>
  new AppError('Token expired. Please log in again.', 401);

// Global error handling middleware
module.exports = (err, req, res, next) => {
  // Set default values if properties are not set
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Send error response
  if (process.env.NODE_ENV == 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV == 'production') {
    let error = { ...err };
    error.message= err.message;
    //this one is to handle invaild id's in production and set them to operational errors
    if (err.name == 'CastError') error = handleCastErrorDb(err);
    //this is when is to handle duplicate fields error and set them to operational errors
    if (err.code === 11000) error = handleDublicateFieldsDb(err);
    //this is to handle validation errors and set them to operational errors
    if (err.name == 'ValidationError') error = handleValidationErrorDb(err);

    //this will handle if there is no token or if its wrong
    if (err.name == 'JsonWebTokenError') error = handleJWTError();
    //this will handle if the token is expired  and set them to operational errors
    if (err.name == 'TokenExpiredError') error = handleJWTExpired();
    sendErrorProd(error, req, res);
  }
};
