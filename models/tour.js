const mongoose = require('mongoose');
const slugify = require('slugify');

// Creating a schema for Tours
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tour name is required'],
      unique: true,
      maxlength: [40, 'Tour name should not exceed 40 characters'],
      minlength: [10, 'Tour name should not be less than 10 characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'Max group size is required'],
    },
    difficulty: {
      type: String,
      required: [true, 'Difficulty is required'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty must be either easy, medium, or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating should be above 1.0'],
      max: [5, 'Rating should be below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // This only points to current doc on NEW document creation, not on update
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below the regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'Image cover is required'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now,
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON - Start location of the tour
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    // These are fields that don't get stored in the database but display in output
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocations: '2dsphere' });

//VIRTUAL POPULATE
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});
//DOCUMENT MIDDLEWARE: uns before .save() and create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  //   console.log(this);
  next();
});
//
// tourSchema.pre('save', async function (next) {
// const guidesPromises = this.guides.map(async id => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

//QUERY MIDDLEWARE: runs before.find(),.findOne(),.countDocuments()
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.startTime = new Date();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});
//AGGREGATION MIDDLE
tourSchema.pre('aggregate', function (next) {
  //we are pushing the $match stage to the beginning of the pipeline to ensure that our secret tours are not included in the aggregation
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});
//post query
tourSchema.post(/^find/, function (docs, next) {
  // console.log(`Query took ${Date.now() - this.startTime} milliseconds`);
  next();
});
//creating a model called Tour using the schema
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
