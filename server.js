'use strict';

//Global variables
var recipeResults = [];

//Application Dependencies
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const cors = require('cors');
const expressJwt = require('express-jwt');
const logger = require('morgan');

// Load environment variables from .env file
require('dotenv').config();

// Application/Middleware Setup
const app = express();
const PORT = process.env.PORT || 5000;
app.use(logger('dev'));
app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({extended: false}));

//Database Setup
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

//Constructor
function Recipe (recipe){
    this.label = recipe.label;
    this.image = recipe.image;
    this.yield = Number(recipe.yield);
    this.url = recipe.url;
    this.calories = Math.ceil(Number(recipe.calories));
    this.totalTime = Number(recipe.totalTime);
    this.ingredients = recipe.ingredientLines;
    this.dietLabels = recipe.dietLabels;
    this.healthLabels = recipe.healthLabels;
    recipeResults.push(this);
}

// Helper function: This allows our server to parse the incoming token from the client
// This is being run as middleware, so it has access to the incoming request
function fromRequest(req){
    console.log('hello', req.body);
    if(req.body.headers &&
      req.body.headers.Authorization &&
      req.body.headers.Authorization.split(' ')[0] === 'Bearer'){
        return req.body.headers.Authorization.split(' ')[1];
    }
    return null;
}

//API Routes
app.get('/', getAll);
app.get('/search', getRecipes);
app.use('/auth', expressJwt({
    secret: process.env.JWT_SECRET,
    getToken: fromRequest
}).unless({
    path: [{ url: '/auth/login', methods: ['POST'] }, { url: '/auth/signup', methods: ['POST'] }]
}), require('./controllers/auth'));

/********* sql queries to postgres *********/
function saveToDatabase(recipe){
    const SQL = 'INSERT into recipes (label, image, yield, url, calories, total_time, ingredients, diet_labels, health_labels) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT DO NOTHING;';
    const values = [recipe.label, recipe.image, recipe.yield, recipe.url, recipe.calories, recipe.totalTime, recipe.ingredients, recipe.dietLabels, recipe.healthLabels];

    client.query(SQL, values);
}

function getFromDatabase(req){
    let inputType;
    let columnName;
    let SQL;

    if(req.query.health !== '' && req.query.q !== '') {
        SQL = `SELECT * FROM recipes
        WHERE (ARRAY_TO_STRING(health_labels, '||') ILIKE '%${req.query.health}%' AND ARRAY_TO_STRING(ingredients, '||') ILIKE '%${req.query.q}%');`;
    }
    else {
        if (req.query.health !== '') {
            inputType = 'health';
            columnName = 'health_labels';
        } else {
            inputType = req.query.q;
            columnName = 'ingredients';
        }
        SQL = `SELECT * FROM recipes WHERE ARRAY_TO_STRING(${columnName}, '||') ILIKE '%${inputType}%';`;
    }
    return client.query(SQL);
}

//get all recipes
function getAll(req, res) {
    recipeResults = [];

    const SQL = 'SELECT * FROM recipes;';

    return client.query(SQL).then(result => {
        if(result.rowCount > 0) {
            result.rows.forEach(row => {
                new Recipe(row);
                //(row);
            });
            res.send(recipeResults);
        } else {
            console.log('database is empty');
        }
    });
}

/*************** calls to api *****************************/
function getRecipes(req, res) {
    recipeResults = [];
    getFromDatabase(req)
        .then(result => {

            if(result.rowCount > 99) {
                result.rows.forEach(row => {
                    new Recipe(row);
                });
                return res.send(recipeResults);
            } else { //query
                let url = '';
                if ( req.query.health && req.query.q) {
                    url = `https://api.edamam.com/search?q=${req.query.q}&health=${req.query.health.toLowerCase()}&app_id=${process.env.API_ID}&app_key=${process.env.API_KEY}&to=100`;
                } else if ( req.query.health !== '') {
                    url = `https://api.edamam.com/search?q=${req.query.health}&app_id=${process.env.API_ID}&app_key=${process.env.API_KEY}&to=100`;
                } else {
                    url = `https://api.edamam.com/search?q=${req.query.q}&app_id=${process.env.API_ID}&app_key=${process.env.API_KEY}&to=100`;
                }
                return superagent.get(url)
                    .then(result =>{
                        if(result.body.hits.length > 0) {
                            result.body.hits.forEach( resultRecipe => {
                                let recipe = new Recipe(resultRecipe.recipe);
                                saveToDatabase(recipe);
                            });
                        }
                        return res.send(recipeResults);
                    });
            }
        })
        .catch(error=> {
            console.log(`Your shit's erroring out ${error}`);
            res.send('There are no results for this search');
        });
}

app.listen(process.env.PORT, () => console.log(`listening on ${PORT}`));

