const express = require('express');
const router = express.Router();
const bcryptjs = require('bcryptjs');
const auth = require('basic-auth');

const { Course, User }  = require('./models');
const {check, validationResult } = require('express-validator');

function asyncHandler(cb){
    return async (req,res, next) => { 
        try {
            await cb(req, res, next);
        } catch(err) {
            next(err);
        }
    }
}

/**
 * Middleware for User authentication
 */ 
const authenticateUser = asyncHandler(async (req, res, next) => {
    let message = null;
    // Parse the user's credentials from the Authorization header.
    const credentials = auth(req);
    // If the user's credentials are available...
    if (credentials) {
        // Look for a user whose `username` matches the credentials `name` property.
        const users = await User.findAll()
        const user = users.find(user => user.emailAddress === credentials.name);
        // If a user was successfully retrieved from the data store...
        // Use the bcryptjs npm package to compare the user's password
        // (from the Authorization header) to the user's password
        // that was retrieved from the data store.
        if (user) {
            const authenticated = bcryptjs.compareSync(credentials.pass, user.password);
            // If the passwords match...
            if (authenticated) {
                console.log(`Authentication successful for username: ${user.username}`);
                // Store the user on the Request ojbect
                req.currentUser = user;
            } else {
                message = `Authentication failure for username: ${user.username}`;
            }
        } else {
            message = `User not found for username: ${credentials.name}`;
        }
    } else {
        message = 'Auth header not found';
    }
    // If user authentication failed...
    if (message) {
        console.warn(message);
        // Return a response with a 401 Unauthorized HTTP status code.
        res.status(401).json({ message: 'Access Denied' });
    } else {
        // Or if user authentication succeeded...
        // Call the next() method.
        next();
    }
});

/************
 * USER ROUTE
 ***********/

//Route that returns a list of users
router.get('/users', authenticateUser, asyncHandler(async (req, res) => {
    const user = req.currentUser;
    res.status(200).json(user);
}));

//Route that creates a new user
router.post('/users', [
    check('firstName')
        .exists({ checkFalsy: true, checkNull: true })
        .withMessage('Please provde a value for "First name"'),
    check('lastName')
        .exists({ checkFalsy: true, checkNull: true})
        .withMessage('Please provide a value for "lastName"'),
    check('emailAddress')
        .isEmail()
        .withMessage('Please enter a valid email address')
        .exists({ checkFalsy: true, checkNull: true})
        .withMessage('Please provide a value for "emailAddress"'),
    check('password')
        .exists({ checkFalsy: true, checkNull: true})
        .withMessage('Please provide a value for "password"'), 
], asyncHandler(async (req, res) => {
    // Attempt to get the validation result from the Request object.
    const errors = validationResult(req);
    // If there are validation errors...
    if (!errors.isEmpty()) {
        // Use the Array `map()` method to get a list of error messages.
        const errorMessages = errors.array().map(error => error.msg)
        // Return the validation errors to the client.
        return res.status(400).json({ errors: errorMessages });
    } else {
        // Hash the new user's password.
        req.body.password = bcryptjs.hashSync(req.body.password);
        const user = await User.create(req.body);
        console.log("User successfully created!")
        res.status(201).location('/').end();
    }  
}));

/**************
 * COURSE ROUTE
 *************/
//Send a GET request to /courses to get a list of courses
router.get('/courses', asyncHandler(async (req, res) => {
    const courses = await Course.findAll({
        include: [
            {
                model: User
                //as: 'user'
            }
        ]
    })
    res.json(courses);
}));

//Send a GET request to /courses/:id to get individual course
router.get('/courses/:id', asyncHandler(async (req, res) => {
    const course = await Course.findByPk(req.params.id);
    res.json(course);
}));

//Send a POST request to create a new course
router.post('/courses', [
    check('title')
        .exists({ checkFalsy: true, checkNull: true})
        .withMessage('Please provide a value for "title"'),
    check('description')
        .exists({ checkFalsy: true, checkNull: true})
        .withMessage('Please provide a value for "description"'),

], authenticateUser, asyncHandler(async (req, res) => {
    // Attempt to get the validation result from the Request object.
    const errors = validationResult(req);
    // If there are validation errors...
    if (!errors.isEmpty()) {
        // Use the Array `map()` method to get a list of error messages.
        const errorMessages = errors.array().map(error => error.msg)
        // Return the validation errors to the client.
        return res.status(400).json({ errors: errorMessages });
    } else {
        const course = await Course.create(req.body);
        res.status(201).location(`/courses/${course.id}`).end();
    } 
}));

//Send a PUT request to update a course
router.put('/courses/:id', [
    check('title')
        .exists({ checkFalsy: true, checkNull: true})
        .withMessage('Please provide a value for "title"'),
    check('description')
        .exists({ checkFalsy: true, checkNull: true})
        .withMessage('Please provide a value for "description"'),
], authenticateUser, asyncHandler(async (req, res) => {
    // Attempt to get the validation result from the Request object.
    const errors = validationResult(req);
    // If there are validation errors...
    if (!errors.isEmpty()) {
        // Use the Array `map()` method to get a list of error messages.
        const errorMessages = errors.array().map(error => error.msg)
        // Return the validation errors to the client.
        res.status(400).json({ errors: errorMessages });
    } else {
        const course = await Course.findByPk(req.params.id);
        if(course) {
            await course.update(req.body);
            res.status(204).end();
        } else {
            res.status(404).json({ message: 'Course Not Found.'})
        }
    }
}));

// //Send a POST request to delete a course
router.delete('/courses/:id', authenticateUser, asyncHandler(async (req, res) => {
    const course = await Course.findByPk(req.params.id);
    if(course) {
        await course.destroy();
        res.status(204).end();
    } else {
        res.sendStatus(404);
    }
}));

module.exports = router;

