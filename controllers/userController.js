const multer = require('multer');
const sharp = require('sharp');
const User = require('./../models/user');
const catchAsync = require('./../utlis/catchAsync');
const AppError = require('./../utlis/appError');
const factory = require('./handlerFactory');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     // destination has access to the req , the file being uploaded and the callback function
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images ', 400), false);
  }
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});
exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterdObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword',
        400,
      ),
    );
  }

  // 2) Filtered out unwanted field names that are not allowed
  const filteredBody = filterdObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;
  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true, // Return the updated document instead of the original one
    runValidators: true, // Run the validators on the updated document
  });

  res
    .status(200)
    .set(
      'Content-Security-Policy',
      "default-src 'self'; base-uri 'self'; block-all-mixed-content; font-src 'self' https: data:; frame-ancestors 'self'; img-src 'self' data:; object-src 'none'; script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob:; script-src-attr 'none'; style-src 'self' https: 'unsafe-inline'; upgrade-insecure-requests;",
    )
    .json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  //1) check the user password before deleting

  const user = await User.findOne({ _id: req.user.id }).select('+password');
  if (!(await user.correctPassword(req.body.password, user.password))) {
    return next(
      new AppError('Incorrect password,Enter correct password to delete!', 401),
    );
  }

  //2) delete user document

  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// exports.getAllUsers = catchAsync(async (req, res, next) => {
//   const users = await User.find();

//   res.status(200).json({
//     status: 'sucess',
//     results: users.length,
//     data: {
//       users,
//     },
//   });
// });
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
exports.getAllUsers = factory.getAllOne(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User); //DO NOT UPDATE USER WITH THIS
exports.deleteUser = factory.deleteOne(User);

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet implemented',
  });
};

// exports.getUser = catchAsync(async (req, res, next) => {
//   const user = await User.findById(req.params.id);
//   if (!user) return next(new AppError('No user found with that ID', 404));
//   res.status(200).json({
//     status:'success',
//     data: {
//       user,
//     },
//   })
// });

// exports.deleteUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet implemented',
//   });
// };
