const Tour = require('./../models/tour');
  const User = require('./../models/user');
const Booking = require('./../models/booking');
const catchAsync = require('./../utlis/catchAsync');
const AppError = require('./../utlis/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
  //1) Get tour data from collection
  const tours = await Tour.find();

  res.status(200).set(
    'Content-Security-Policy',
    "default-src 'self'; base-uri 'self'; block-all-mixed-content; font-src 'self' https: data:; frame-ancestors 'self'; img-src 'self' data:; object-src 'none'; script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob:; script-src-attr 'none'; style-src 'self' https: 'unsafe-inline'; upgrade-insecure-requests;"
  ).render('overview', {
    title: 'All Tours',
    tours
  });
  //2) Build template

  //3) Render template with tour data from 1)
});
exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  })
  if (!tour) {
    return next(new AppError('No tour found with that name', 404))
  }
  res
  .status(200)
  .set(
    'Content-Security-Policy',
    "default-src 'self' https://*.mapbox.com; base-uri 'self'; block-all-mixed-content; font-src 'self' https: data:; frame-src https://js.stripe.com 'self'; img-src 'self' data:; object-src 'none'; script-src https://cdnjs.cloudflare.com https://api.mapbox.com https://js.stripe.com 'self' blob:; script-src-attr 'none'; style-src 'self' https: 'unsafe-inline'; upgrade-insecure-requests;"
  )
  .render('tour', {
    title: `${tour.title} Tour`,
    tour
  });
});

exports.loginForm = catchAsync(async(req,res,next)=>{
  res
  .status(200)
  .set(
    'Content-Security-Policy',
    "default-src 'self'; base-uri 'self'; block-all-mixed-content; font-src 'self' https: data:; frame-ancestors 'self'; img-src 'self' data:; object-src 'none'; script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob:; script-src-attr 'none'; style-src 'self' https: 'unsafe-inline'; upgrade-insecure-requests;"
  ).render('login')

});

exports.getAccount = catchAsync(async(req,res,next) => {
  res.status(200)
  .set(
    'Content-Security-Policy',
    "default-src 'self'; base-uri 'self'; block-all-mixed-content; font-src 'self' https: data:; frame-ancestors 'self'; img-src 'self' data:; object-src 'none'; script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob:; script-src-attr 'none'; style-src 'self' https: 'unsafe-inline'; upgrade-insecure-requests;"
  ).render('account',{
    title: 'Your account'
  });
});

exports.getMyTours = catchAsync(async(req,res,next) =>{
// 1) Find all bookings

const bookings = await Booking.find({user : req.user.id});

//2) Find tours with a booking
const tourIDs = bookings.map(el => el.tour);
const tours = await Tour.find({_id: {$in: tourIDs}}); 

res.status(200).render('overview',{
  title: 'My Tours',
  tours
})
});