const crypto = require('crypto');
const { promisify } = require('util');
const User = require('./../models/user');
const jwt = require('jsonwebtoken');
const AppError = require('./../utlis/appError');
const catchAsync = require('./../utlis/catchAsync');
const Email = require('./../utlis/email');
const bcrypt = require('bcryptjs');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};
exports.signUp = catchAsync(async (req, res) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, res);
});

//we use catchasync to avoid using the try/catch block for error handling
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1) check if email and password fields are filled
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  //2)check if user exists and password is correct
  // you can also say {email:email}
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  //3) if everything is ok, send jwt token to the client
  createSendToken(user, 200, res);
});

exports.logout = (req, res, next) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  //1)getting token check if  exists
  let token;
  if (
    req.headers.authorization && // this is the handle cookies in the api (postman)
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    //this is to hadle cookies from the browser
    token = req.cookies.jwt;
  }
  //   console.log(token);
  if (!token) {
    return next(
      new AppError('You are not logged in. Please login to get access', 401),
    );
  }
  //2) verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //   console.log(decoded);
  //3) check if user exists
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError('The user belonging to the token does no loger exit.', 401),
    );
  }
  //4) check if user changed password after jwt was issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password. Please log in again.', 401),
    );
  }
  //GRANT ACCESS TO THE ROUTE
  req.user = freshUser; //store user in req object for other middleware to use
  res.locals.user = freshUser;

  next();
});

exports.isLoggedIn = catchAsync(async (req, res, next) => {
  //1)getting token check if  exists
  if (req.cookies.jwt) {
    //this is to hadle cookies from the browser
    try {
      //2) verification token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );

      //3) check if user exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      //4) check if user changed password after jwt was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to access this route', 403),
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on Posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('No user found with that email', 404));
  }

  //2) Generate the random reset token
  const resetToken = await user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });

  try {
    //3) Send it to user's email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    console.error('Error sending email:', err); // Log the detailed error
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500,
      ),
    );
  }
});
exports.restPassowrd = catchAsync(async (req, res, next) => {
  //1) Get user based on token
  //1a) encrypt the token and compare it to the one in the database
  //2) if token hasn not expired,and there is a user . set new password
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordRestToken: hashedToken,
    passwordResetExpiresAt: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Token is invalid or expired', 400));
  }

  //3) update changedPasswordAt property for the user

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetExpiresAt = undefined;
  user.passwordRestToken = undefined;
  // user.passwordChangedAt = undefined;
  //WE USE SAVE() WITH ANYTHING REALTED TO PASSWORDS INSEAD OF UPDATE BECASUE WE WANT TO RUN ALL THE VALIDATORS
  await user.save();
  console.log('Password reset successful');
  //4) log in user , send JWT to client

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1) Get user from collection
  //we use  req.user.id since we already logged in so we have the user on our req obj
  const user = await User.findById(req.user.id).select('+password');
  //2) Check if password and confirm password match
  //4) If passwords match, update the password
  if (!(await user.correctPassword(req.body.currentPassword, user.password)))
    return next(new AppError('Your current password is incorrect', 401));
  //3) If passwords do not match, return an error

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  // you cant use update since we want to run all the validators for password
  await user.save();

  createSendToken(user, 200, res);
});
