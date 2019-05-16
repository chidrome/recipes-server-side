'use-strict';
require('dotenv').config();
const express = require('express');
const pg = require('pg');
const jwt = require('jsonwebtoken');
const router = express.Router();
const bcrypt = require('bcrypt');

//Database Setup
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));


// POST /auth/login route - returns a JWT
router.post('/login', (req, res) => {
    console.log('In the POST /auth/login route');
    console.log(req.body);

    const SearchEmail = `SELECT * FROM users WHERE email = '${req.body.email.toLowerCase()}'`;

    client.query(SearchEmail)
        .then(user => {
            if(!user.rows[0].email || !user.rows[0].password){
                return res.status(400).send('User not found');
            }
            // user found, check password
            bcrypt.compare(req.body.password, user.rows[0].password, (error, passwordsMatch) => {
                if(passwordsMatch){
                    const token = jwt.sign(user.rows[0], process.env.JWT_SECRET, {
                        expiresIn: 60 * 60 * 24 // 24 hours (in seconds)
                    });
                    res.send({ token: token });
                } else {
                    return res.status(401).send('Invalid Credentials');
                }
                if(error){
                    console.log(`Error comparing password. ${error}`);
                }
            });
        });

});

// POST /auth/signup route - create a user in the DB and then log them in
router.post('/signup', (req, res) => {
    const SearchEmail = `SELECT * FROM users WHERE email = '${req.body.email.toLowerCase()}'`;

    client.query(SearchEmail)
        .then(results => {
            if(results.rowCount === 0){
                bcrypt.hash(req.body.password, 10, (error, hash) => {
                    const SQL = 'INSERT into users (name, email, password) VALUES($1, $2, $3) ON CONFLICT DO NOTHING;';
                    const values = [req.body.name.toLowerCase(), req.body.email.toLowerCase(), hash];
                    client.query(SQL, values)
                        .then(results => {
                            console.log('Hi');
                            console.log(results);
                            const token = jwt.sign(results.rows[0], process.env.JWT_SECRET, {
                                expiresIn: 60 * 60 * 24 // 24 hours (in seconds)
                            });
                            res.send({ token: token });
                            console.log(`this is your token ${token}`);

                        })
                        .catch(error => {
                            console.log(`error signing up ${error}`);
                        });
                    if(error){
                        console.log(`There's been an error with hashing your password! ${error}`);
                    }
                });
                console.log(`results after the bcrypt------------- ${results}`);
            } else if(results.rowCount === 1){
                // created a new user. Yay! Time to send a token for them!
                const token = jwt.sign(results.rows[0], process.env.JWT_SECRET, {
                    expiresIn: 60 * 60 * 24 // 24 hours (in seconds)
                });
                res.send({ token: token });
            }
        })
        .catch(error => {
            console.log(`error signing up ${error}`);
        });
});

// This is what is returned when client queries for new user data
router.post('/current/user', (req, res) => {
    if(!req.user || !req.user.id){
        return res.status(401).send({ user: null });
    }
    const SearchUserId = `SELECT * FROM users WHERE id = '${req.user.id}'`;
    client.query(SearchUserId)
        .then(results => {
            res.send({user: results.rows[0]});
        })
        .catch(error => {
            console.log('Error in GET /auth/current/user: ', error);
            res.status(503).send({ user: null });
        });
});




module.exports = router;




