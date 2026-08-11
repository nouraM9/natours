const express = require('express');
const bookingController = require('./../controllers/bookingController');
const authController = require('./../controllers/authController');
const router = express.Router();

router
  .route('/checkout/:tourId')
  .get(authController.protect, bookingController.getCheckoutSession);


router.use(authController.protect); //Only admins can access the routes below

router.use(authController.restrictTo('admin')); //Only admins can access the routes below

router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route('/:id')
  .patch(bookingController.updateBooking)
  .get(bookingController.getBooking)
  .delete(bookingController.deleteBooking);


module.exports = router;
