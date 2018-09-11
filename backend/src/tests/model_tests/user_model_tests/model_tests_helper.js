// NOTE: This file is used to initialize a connection to the server before any tests run and externalize other functionality
// here we setup and initialize Mongoose just like we would normally:
const mongoose = require('mongoose');

// configuring the database
mongoose.Promise = global.Promise
const databaseOptions = {
    useNewUrlParser: true, // mongoose's URL parser is also deprecated, so we pass this in as a option to use the new one
};
mongoose.set('useCreateIndex', true); // collection.ensureIndex is also deprecated so we use 'useCreateIndex' instead

// connects to the database before the tests start
before(done => {
    mongoose.connect('mongodb://localhost:27017/store', databaseOptions);
    mongoose.connection
        .once('open', () => mongoose.connection.collections.users.drop(() => done())) // here no test will run until done() is executed
        .on('error', (err) => console.warn(`There was an error connecting to the database: \n${err}`));
});

// drops the users database after every test file runs
afterEach(done => {
    mongoose.connection.collections.users.drop(() => done())
})