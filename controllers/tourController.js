const multer = require('multer');
const sharp = require('sharp');
const Tour = require('./../models/tour');
const APIFeatures = require('./../utlis/apiFeatures');
const catchAsync = require('./../utlis/catchAsync');
const AppError = require('./../utlis/appError');
const factory = require('./handlerFactory');
// Middleware

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

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  //1) Cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1300)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  //2) Images
  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);
      req.body.images.push(filename);
    }),
  );
console.log(req.body);
  next();
});
exports.aliasTopTours = (req, res, next) => {
  (req.query.limit = '5'), (req.query.sort = '-ratingsAverage,price');
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

//Route controllers
// exports.getAllTous = catchAsync(async (req, res, next) => {
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();
//   //Excuting the query
//   const tours = await features.query;
//   res.status(200).json({
//     status: 'sucess',
//     results: tours.length,
//     data: {
//       tours,
//     },
//   });
// });
//This line creates a copy of the query parameters sent by the client

//1A)Filtering
// const queryObj = { ...req.query };
// const excludeFields = ['page', 'sort', 'limit', 'fields'];
// //This loop goes through each field in excludeFields and deletes it from queryObj.
// excludeFields.forEach((el) => delete queryObj[el]);

// //1B)Advanced Filltering
// let queryStr = JSON.stringify(queryObj);
// queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
// console.log(JSON.parse(queryStr));

// // console.log(req.query);
// let query = Tour.find(JSON.parse(queryStr));

//3)Sorting

// if (req.query.sort) {
//   const sortBy = req.query.sort.split(',').join(' ');
//   query = query.sort(sortBy);
//   // console.log(sortBy);
// } else {
//   query = query.sort('-createdAt');
// }
// console.log(query);

//Fileds Limiting
// if (req.query.fields) {
//   const fields = req.query.fields.split(',').join(' ');
//   query = query.select(fields);
//   // console.log(fields);
// } else {
//   query = query.select('-__v');
// }

//4)Pagination
// const page = req.query.page * 1 || 1;
// const limit = req.query.limit * 1 || 100;
// const skip = (page - 1) * limit;
// query = query.skip(skip).limit(limit);

// if (req.query.page) {
//   const numTours = await Tour.countDocuments();
//   if (skip >= numTours);
// }
// console.log(query);

// exports.getTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findById(req.params.id).populate('reviews');
//   if(!tour){
//     return next(new AppError('No tour found with that ID', 404))
//   }
//   res.status(200).json({
//     status: 'sucess',
//     data: {
//       tour,
//     },
//   });
// });

// exports.createTour = catchAsync(async (req, res, next) => {
//   const newTour = await Tour.create(req.body);
//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: newTour,
//     },
//   });
// });
exports.getAllTours = factory.getAllOne(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  // Convert the distance to radians based on the unit (miles or kilometers)
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  // Check if lat or lng is missing and return an error if so
  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400,
      ),
    );
  }

  console.log({ distance, lat, lng, radius });

  // Find tours within the specified radius using geospatial query
  const tours = await Tour.find({
    startLocations: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  // Send the response with the found tours
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

// exports.updateTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true, // this will return the new updated document instead of the original one
//     runValidators: true, // this will run the validators on the updated document
//   });
//   if(!tour){
//     return next(new AppError('No tour found with that ID', 404))
//   }
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour,
//     },
//   });
// });

exports.updateTour = factory.updateOne(Tour);
// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);
//   if(!tour){
//     return next(new AppError('No tour found with that ID', 404))
//   }
//   res.status(204).json({
//     status: 'sucess',
//     data: null, // return an empty object since we deleted the document
//   });
// });

exports.deleteTour = factory.deleteOne(Tour);
//aggregation for tour stats
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }, // Corrected condition
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' }, // Group by difficulty
        numTours: { $sum: 1 }, // Count number of tours
        numRatings: { $avg: '$ratingsAverage' }, // Average number of ratings
        avgRating: { $avg: '$ratingsAverage' }, // Average rating
        avgPrice: { $avg: '$price' }, // Average price
        minPrice: { $min: '$price' }, // Minimum price
        maxPrice: { $max: '$price' }, // Maximum price
      },
    },
    { $sort: { avgPrice: 1 } }, // Sort by average price in ascending order
  ]);

  res.status(200).json({
    // Changed status to 200 for success with data
    status: 'success',
    data: { stats },
  });
});
//aggregation for monthly plans stats
exports.monthlyPlans = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { tours: -1 },
    },
    {
      $limit: { limit: 3 },
    },
  ]);

  res.status(200).json({
    // Changed status to 200 for success with data
    status: 'success',
    data: {
      plan,
    },
  });
});
