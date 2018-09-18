// NOTE: This router handles requests related to the user's personal section
// importing dependencies
const express = require('express');

// importing models
const UserModel = require('../../models/UserModel');

// intializing the router
const router = express.Router();

// importing middleware
const verifyJWTMiddleware = require('../routing_middleware/verifyJWTMiddleware');

// adding the routes
router.get('/', (req, res) => res.send(`The home router is working!`)); // test router

// * TODO: Figure out how to pass review data from here
// * TODO: Decide between passing the email from the JWT or getting the username via URL
// * QUESTION: How should I look the user up from here?
// gets all of the user's information -- particularly their reviews
router.get('/data', verifyJWTMiddleware, (req, res) => {
    const { email } = req;
    
    UserModel.findOne({ email })
        .populate({
            path: 'reviews',
            model: 'reviews'
        })
        .then(record => {
            res.json(record);
        })
        .catch(err => {
            res.send(500).json({ databaseError: "There was an error getting the user data, please try again" });
        })
});

//route to change user status to paid or unpaid: (and other user data as needed)
router.put('/data', verifyJWTMiddleware, (req, res) => {
    const { email } = req;
    const { paid } = req.body;
    UserModel.findOneAndUpdate({ email }, { paid }, {new: true})
        .then(record => {
            res.json(record);
        })
        .catch(err => {
            res.send(500).json({ databaseError: "There was an error updating the user data, please try again" });
        })
});


// exporting the router
module.exports = router;