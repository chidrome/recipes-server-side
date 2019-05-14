'use strict';

//Global variables
var recipeResults = [];

//Application Dependencies
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const cors = require('cors');

// Load environment variables from .env file
require('dotenv').config();

// Application Setup
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

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

//API Routes
app.get('/', getAll);
app.get('/healthsearch/:health', getRecipes);
app.get('/labelsearch/:q', getRecipes);
app.get('/labelhealthsearch/:q/:health', getRecipes);


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
    if(req.query.health && req.query.q) {
        SQL = `SELECT * FROM recipes
        WHERE (ARRAY_TO_STRING(health_labels, '||') LIKE '%${req.query.health}%' AND ARRAY_TO_STRING(ingredients, '||') LIKE '%${req.query.q}%');`;
    }
    else {
        if (!req.query.q) {
            inputType = 'health';
            columnName = 'health_labels';
        } else {
            inputType = req.query.q;
            columnName = 'ingredients';
        }
        SQL = `SELECT * FROM recipes WHERE ARRAY_TO_STRING(${columnName}, '||') LIKE '%${inputType}%';`;
    }
    return client.query(SQL);
}

//get all recipes
function getAll(req, res) {
    const SQL = 'SELECT * FROM recipes;';

    return client.query(SQL).then(result => {
        if(result.rowCount > 0) {
            result.rows.forEach(row => {
                new Recipe(row);
                console.log(row);
            });
            res.send(recipeResults);
        } else {
            console.log('database is empty');
        }
    });
}

/*************** calls to api *****************************/
function getRecipes(req, res) {

    getFromDatabase(req)
        .then(result => {
            if(result.rowCount > 0) {
                result.rows.forEach(row => {
                    new Recipe(row);
                    console.log(row);
                });
                res.send(recipeResults);
            } else { //query
                let url = '';

                if ( req.query.health && req.query.q ) {
                    url = `https://api.edamam.com/search?q=${req.query.q}&health=${req.query.diet}&app_id=${process.env.API_ID}&app_key=${process.env.API_KEY}`;
                } else if ( req.query.health ) {
                    url = `https://api.edamam.com/search?q=${req.query.diet}&app_id=${process.env.API_ID}&app_key=${process.env.API_KEY}`;
                } else {
                    url = `https://api.edamam.com/search?q=${req.query.q}&app_id=${process.env.API_ID}&app_key=${process.env.API_KEY}`;
                }
                return superagent.get(url)
                    .then(result =>{
                        if(result.body.hits.length > 0) {
                            result.body.hits.forEach( resultRecipe => {
                                let recipe = new Recipe(resultRecipe.recipe);
                                saveToDatabase(recipe);
                            });
                        }
                        res.send(recipeResults);
                    });
            }
        });
}

app.listen(PORT, () => console.log(`listening on ${PORT}`));

