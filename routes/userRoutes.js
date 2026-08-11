const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');
const express = require('express');
const router = express.Router();

//the imgs will be saved on the destination

router.post('/signup', authController.signUp);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.restPassowrd);

router.get(
  '/me',
  authController.protect,
  userController.getMe,
  userController.getUser,
);

// Protect all routes after this middleware
router.use(authController.protect);

router.patch('/updatePassword', authController.updatePassword);
router.patch('/updateMe',userController.uploadUserPhoto,userController.resizeUserPhoto, userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);

router.use(authController.restrictTo('admin')); //Only admins can access the routes below


router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);
 
module.exports = router; // Correct way to export the router
