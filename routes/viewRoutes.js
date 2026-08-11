const express = require('express');
const viewController = require('./../controllers/viewController');
const authController = require('./../controllers/authController');
const bookingController = require('../controllers/bookingController');
const router = express.Router();

router
  .route('/')
  .get(
    bookingController.createBookingCheckout,
    authController.isLoggedIn,
    viewController.getOverview,
  );
router
  .route('/tour/:slug')
  .get(authController.isLoggedIn, viewController.getTour);
router.route('/login').get(authController.isLoggedIn, viewController.loginForm);
router.route('/me').get(authController.protect, viewController.getAccount);
router.route('/my-tours').get(authController.protect, viewController.getMyTours);

module.exports = router;
