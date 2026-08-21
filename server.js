const mongoose = require('mongoose');
const dotenv = require('dotenv');
// Load environment variables from .env file
dotenv.config();
// dotenv.config({ path: './.env' }); // thuis only locally
const app = require('./app');

// Handling uncaught exceptions

console.log('DATABASE EXISTS:', !!process.env.MONGODB_URI);
console.log('PASSWORD EXISTS:', !!process.env.DATABASE_PASSWORD);
console.log('DATABASE HOST:', process.env.MONGODB_URI?.split('@')[1]);
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥');
  console.log(err.name, err.message);
});

const DB = process.env.MONGODB_URI.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose.set('bufferCommands', false); // fail fast instead of buffering 10s
mongoose.set('debug', process.env.NODE_ENV === 'development');

mongoose.connection.on('error', (err) => {
  console.log('❌ Mongoose connection error:', err);
});
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected');
});
mongoose.connection.on('reconnected', () => {
  console.log('✅ Mongoose reconnected');
});
mongoose
  .connect(DB)
  .then(() => {
    console.log('DB connection successful');
  })
  .catch((err) => {
    console.log('❌ DB connection failed');
    console.log(err);
  });

// Starting the server
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App is running on port ${port}...`);
});

// Handling unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥');
  console.log(err.name, err.message);
  server.close(() => {
    // console.log('Server closed.');
    process.exit(1); // Exit the process with an error code
  });
});

//   // Force exit if server doesn't close in a reasonable time
//   setTimeout(() => {
//     console.error('Forcing exit due to uncaught exception...');
//     process.exit(1);
//   }, 5000); // Adjust timeout as needed
// });
