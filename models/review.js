const mongoose = require('mongoose');
const Tour = require('./tour');
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'There needs to be a review'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    //CHILD REFRENCING
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
  },
  {
    //these are fields that dont get stored in the database but display in output
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Prevent duplicate reviews (user leaving more than one comment on a single tour)
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// Static method to calculate average ratings for a specific tour
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // Use aggregation to calculate the average ratings and the number of ratings
  const stats = await this.aggregate([
    {
      // Match reviews for the given tour
      $match: { tour: tourId },
    },
    {
      // Group by tour and calculate the number of ratings and average rating
      $group: {
        _id: '$tour',
        nRatings: { $sum: 1 }, // Count the number of reviews
        avgRating: { $avg: '$rating' }, // Calculate the average rating
      },
    },
  ]);

  // Check if there are any ratings for the tour
  if (stats.length > 0) {
    // Update the tour with the new ratings quantity and average rating
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRatings,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    // If no ratings exist, set default values for the tour
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5, // Set a default average rating
    });
  }
};

// Post-save middleware to recalculate average ratings after saving a review
reviewSchema.post('save', function () {
  // Call the static method to recalculate ratings for the tour associated with the review
  this.constructor.calcAverageRatings(this.tour);
});

// Pre-findOneAnd middleware to fetch the document before updating or deleting
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // Find the document based on the query criteria and store it in 'this.r'(this being query and we are adding a new filed r)
  this.r = await this.model.findOne(this.getQuery());
  // Continue to the next middleware or operation
  next();
});

// Post-findOneAnd middleware to recalculate average ratings after updating or deleting
reviewSchema.post(/^findOneAnd/, async function () {
  // Call the static method to recalculate ratings for the tour associated with the review
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path:'tour',
  //   select:'name'
  // }).populate({
  //   path:'user',
  //   select: 'name photo'
  // })
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
