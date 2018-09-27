// NOTE: This router handles requests related to reviews

// importing dependencies
const express = require("express");
const ReviewModel = require("../../models/ReviewModel");
const UserModel = require("../../models/UserModel");
const CarModel = require("../../models/CarModel");

// intializing the router
const router = express.Router();
const checkIfCar = require("../routing_middleware/checkIfCar");
const verifyJWTMiddleware = require("../routing_middleware/verifyJWTMiddleware");

// POST new review:

router.post("/", verifyJWTMiddleware, checkIfCar, (req, res) => {
  const {
    title,
    content,
    score,
    carImage,
    year,
    make,
    model,
    edition
  } = req.body;
  const user = req._id;
  let carID;
  if (!user || !content || !score) {
    res
      .status(400)
      .json({ errorMessage: "Please provide user, review, and score." });
    return;
  }
  if (req.carID != null) {
    const car = req.carID;
    ReviewModel.create({ title, user, content, score, car, carImage })
      .then(newReview => {
        // adds review id to the user document of the author
        const id = newReview.user;
        return UserModel.findByIdAndUpdate(
          id,
          { $push: { reviews: newReview._id } },
          { new: true }
        );
      })
      .then(updatedUser => {
        return CarModel.findByIdAndUpdate(
          req.carID, 
          { 
            $push: { 
                reviews: updatedUser.reviews[updatedUser.reviews.length - 1], 
                imageURL: carImage 
            }, 
            averageScore: req.avgScore 
          },
          { new: true }
        );
      })
      .then(updatedCar => {
        return ReviewModel.findById(
          updatedCar.reviews[updatedCar.reviews.length - 1]
        );
      })
      .then(review => {
        res.json(review);
      })
      .catch(err => res.status(500).json({ error: err.message }));
  } else {
    CarModel.create({ year, make, model, edition, averageScore: score, imageURL: carImage })
      .then(newCar => {
        const car = newCar._id;
        carID = newCar._id;
        return ReviewModel.create({
          title,
          user,
          content,
          score,
          carImage,
          car
        });
      })
      .then(newReview => {
        const id = newReview.user;
        return UserModel.findByIdAndUpdate(
          id,
          { $push: { reviews: newReview._id } },
          { new: true }
        );
      })
      .then(updatedUser => {
        return CarModel.findByIdAndUpdate(
          carID,
          {
            $push: {
              reviews: updatedUser.reviews[updatedUser.reviews.length - 1]
            }
          },
          { new: true }
        );
      })
      .then(updatedCar => {
        return ReviewModel.findById(
          updatedCar.reviews[updatedCar.reviews.length - 1]
        );
      })
      .then(review => {
        res.json(review);
      })
      .catch(err => res.status(500).json({ error: err.message }));
  }
});

// route for getting all an individual's reviews:

router.get("/", verifyJWTMiddleware, (req, res) => {
  const user = req._id;
  ReviewModel.find({ user: user })
    .select("car title content score carImage")
    .populate({
      path: "car",
      model: "cars",
      select: "make model year edition averageScore -_id"
    })
    .then(reviews => res.status(200).json(reviews))
    .catch(err => res.status(500).json({ error: err.message }));
});

// route for editing getting and deleting an individual review:

router.put('/:id', verifyJWTMiddleware, (req, res) => {
    const { id } = req.params;
    const { title, content, score, carImage } = req.body;
    const updatedOn = Date.now();
    ReviewModel.findByIdAndUpdate(id, {
      title,
      content,
      score,
      carImage,
      updatedOn
    })
      .then(reviews => res.status(200).json(reviews))
      .catch(err => res.status(500).json({ error: err.message }));
});

router.get('/:id', verifyJWTMiddleware, (req, res) => {
    const { id } = req.params;
    ReviewModel.findById(id)
      .then(review => res.json(review))
      .catch(err => res.status(500).json({ error: err.message }));
});

router.delete('/:id', verifyJWTMiddleware, (req, res) => {
    const { id } = req.params;
    ReviewModel.findByIdAndRemove(id)
      .then(deletedReview => {
        res.json(deletedReview);
        return CarModel.findByIdAndUpdate(deletedReview.car, { "$pull": { reviews: id }}, {new: true})
       })
      .then(updatedCar => {
        return UserModel.findByIdAndUpdate(req._id, { "$pull": { reviews: id }}, {new: true})
       })
      .catch(err => res.status(500).json({ error: err.message }));
});

// search router:
router.post('/search', (req, res) => {
    const { year, make, model, trim, reviewer} = req.body;
    
    // here we setup a search object that only adds values that are actually passed in to the .find method
    const searchObj = {};
    if (year) searchObj.year = year;
    if (make) searchObj.make = make;
    if (model) searchObj.model = model;
    if (trim) searchObj.trim = trim;
    if (reviewer) searchObj.reviewer = reviewer;

    if (reviewer) {
        CarModel.find(searchObj).select('make model year -_id edition averageScore')
            .populate({
                path: 'reviews', 
                model: 'reviews', 
                match: { user: reviewer },
                select: 'title content score user -_id'
            })
            .then(cars=> res.json(cars))
            .catch(err => res.status(500).json({ error: err.message }));
    } else {
        CarModel.find(searchObj).select('make model year -_id edition averageScore')
            .populate({
                path: 'reviews', 
                model: 'reviews',
                select: 'title content score user -_id'
            })
            .then(cars=> {
                console.log(cars);
                res.json(cars);
            })
            .catch(err => res.status(500).json({ error: err.message }));
    }
})

// exporting the router
module.exports = router;
