const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
//creating a schema for Users
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
    minlength: [3, 'Name should not be less than 3 characters'],
    maxlength: [30, 'Name should not exceed 30 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
    // required: [true, 'Photo is required'],
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    //this will not let it show in any output
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    //custom validators only work on .save() or .create()
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords do not match',
    },
  },
  active :{
    type: Boolean,
    default: true,
  },
  passwordChangedAt: Date,
  passwordRestToken: String,
  passwordResetExpiresAt: Date,
});
//create a modal out of the schema
userSchema.pre('save', async function (next) {
  //we will only run this function is the password is created or is being updated
  if (!this.isModified('password')) return next();

  //hash the password
  const passwordHash = await bcrypt.hash(this.password, 12);
  this.password = passwordHash;
  //delete the passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  //in here when the password is updated this middleware will run to update the passwordchangedAt
  if (!this.isModified('password') || this.isNew) return next();
  //this will be run before each save operation

  this.passwordChangedAt = Date.now() - 1000;
  //we add -1000 to make sure the passwordchangedat will be stored before the token , since sometimes the token is quicker
  next();
});
userSchema.pre(/^find/,function (next) {
  this.find({ active :  {$ne : false}})
  next();
});

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    console.log(changedTimestamp, JWTTimestamp);

    return JWTTimestamp < changedTimestamp;
  }

  //False means the user has not changed password yet
  return false;
};
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword); //this will return true if passwords match, false otherwise  //this is a method for the User model
  //this method will be called automatically when we create a new user or when we update an existing user
};

userSchema.methods.createPasswordResetToken = async function () {
  const restToken = crypto.randomBytes(32).toString('hex');

  this.passwordRestToken = crypto
    .createHash('sha256')
    .update(restToken)
    .digest('hex');

  this.passwordResetExpiresAt = Date.now() + 10 * 60 * 1000;
  // console.log({ restToken });
  // console.log( this.passwordRestToken);

  return restToken;
};
const User = mongoose.model('User', userSchema);
//export the model
module.exports = User;
