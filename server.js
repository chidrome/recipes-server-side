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

function saveToDatabase(recipe){
    const SQL = 'INSERT into recipes (label, image, yield, url, calories, total_time, ingredients, diet_labels, health_labels) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT DO NOTHING;';
    const values = [recipe.label, recipe.image, recipe.yield, recipe.url, recipe.calories, recipe.totalTime, recipe.ingredients, recipe.dietLabels, recipe.healthLabels];

    client.query(SQL, values);
}

function getFromDatabase(inputType, columnName){
    const SQL = `SELECT * FROM recipes WHERE ARRAY_TO_STRING(${columnName}, '||') LIKE '%${inputType}%';`;

    return client.query(SQL)
        .then(result => {
            if(result.rowCount > 0){
                result.rows.forEach(row=>{
                    new Recipe(row);
                    console.log(row);
                });
            }else{
                console.log('database is empty');
            }
        });
}

//API Routes
app.get('/', (res, req) => {
    console.log('hello, welcome to the back end.');
});
app.get('/:health', getRecipes);
app.get('/:q', getRecipes);
app.get('/:q/:health', getRecipes);

//Path functions
function getRecipes(req, res) {
    let url = '';

    if ( req.query.health && req.query.q ) {
        url = `https://api.edamam.com/search?q=${req.query.q}&health=${req.query.diet}&app_id=${process.env.API_ID}&app_key=${process.env.API_KEY}`;
    } else if ( req.query.health ) {
        url = `https://api.edamam.com/search?q=${req.query.diet}&app_id=${process.env.API_ID}&app_key=${process.env.API_KEY}`;
    } else {
        url = `https://api.edamam.com/search?q=${req.query.q}&app_id=${process.env.API_ID}&app_key=${process.env.API_KEY}`;
    }
    url = `https://api.edamam.com/search?q=garlic&app_id=${process.env.API_ID}&app_key=${process.env.API_KEY}`;

    return superagent.get(url)
        .then(result =>{
            if(result.body.hits.length > 0) {
                result.body.hits.forEach( resultRecipe => {
                    let recipe = new Recipe(resultRecipe.recipe);
                    saveToDatabase(recipe);
                });
            }
            res.send(recipeResults);
            getFromDatabase('Peanut-Free', 'health_labels');
        });
}

app.listen(PORT, () => console.log(`listening on ${PORT}`));

