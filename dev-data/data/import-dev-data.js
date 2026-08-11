const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tour');
const User = require('./../../models/user');
const Review = require('./../../models/review');

dotenv.config({ path: './.env' }); // Load environment variables from .env file
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
); // Replace 'password
mongoose.connect(DB).then(() => console.log('DB connection successful!'));
//READ JSON FILE

const tours = JSON.parse(fs.readFileSync(`dev-data/data/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'),
);

//IMPORT DATA INTO DB

const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);

    console.log('Data imported successfully!');
  } catch (err) {
    console.log(err);
  }
  //   process.exit(); // End process after importing data to prevent infinite loop
};

//DELETE DATA FROM DB
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();

    console.log('Data deleted successfully!');
  } catch (err) {
    console.log(err);
  }
  process.exit(); // End process after deleting data to prevent infinite loop
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
console.log(process.argv);
