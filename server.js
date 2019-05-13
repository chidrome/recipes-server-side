'use strict';
/*
result.body.hits

{ recipe:
     { uri:
        'http://www.edamam.com/ontologies/edamam.owl#recipe_b79327d05b8e5b838ad6cfd9576b30b6',
       label: 'Chicken Vesuvio',
       image:
        'https://www.edamam.com/web-img/e42/e42f9119813e890af34c259785ae1cfb.jpg',
       source: 'Serious Eats',
       url:
        'http://www.seriouseats.com/recipes/2011/12/chicken-vesuvio-recipe.html',
       shareAs:
        'http://www.edamam.com/recipe/chicken-vesuvio-b79327d05b8e5b838ad6cfd9576b30b6/chicken',
       yield: 4,
       dietLabels: [Array],
       healthLabels: [Array],
       cautions: [Array],
       ingredientLines: [Array],
       ingredients: [Array],
       calories: 4230.305691201081,
       totalWeight: 2972.9302457924105,
       totalTime: 60,
       totalNutrients: [Object],
       totalDaily: [Object],
       digest: [Array] },
    bookmarked: false,
    bought: false },
*/
//--------------------------------------------------------------------------------------

//Global variables
const recipeResults = [];

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
    this.calories = Math.ceil(Number(recipe.calories));
    this.totalTime = Number(recipe.totalTime);
    this.ingredients = recipe.ingredients;
    this.dietLabels = recipe.dietLabels;
    this.healthLabels = recipe.healthLabels;
    recipeResults.push(this);
}

function saveToDatabase(recipe){
    const SQL = 'INSERT into recipes (label, image, yield, calories, total_time, ingredients, diet_labels, health_labels) VALUES($1, $2, $3, $4, $5, $6, $7, $8);';
    const values = [recipe.label, recipe.image, recipe.yield, recipe.calories, recipe.total_time, recipe.ingredients, recipe.diet_labels, recipe.health_labels];

    client.query(SQL, values);
}

//API Routes
app.get('/:diet', getRecipeByName);
app.get('/:q', getRecipeByName);
app.get('/:q/:diet', getRecipeByName);

//Path functions
function getRecipeByName(req, res) {
    let url = '';

    // if ( req.query.diet && req.query.q ) {
    //     url = `https://api.edamam.com/search?q=${req.query.q}&diet=${req.query.diet}&app_id=${process.env.API_ID}&app_key=${process.env.API_KEY}`;
    // } else if ( req.query.diet ) {
    //     url = `https://api.edamam.com/search?q=${req.query.diet}&app_id=${process.env.API_ID}&app_key=${process.env.API_KEY}`;
    // } else {
    //     url = `https://api.edamam.com/search?q=${req.query.q}&app_id=${process.env.API_ID}&app_key=${process.env.API_KEY}`;
    // }
    url = `https://api.edamam.com/search?q=chocolate&app_id=${process.env.API_ID}&app_key=${process.env.API_KEY}`;

    return superagent.get(url)
        .then(res =>{
            if(res.body.hits.length > 0) {
                res.body.hits.forEach( resultRecipe => {
                    console.log('i am a recipe!!! ', resultRecipe.recipe);
                    let recipe = new Recipe(resultRecipe.recipe);
                    saveToDatabase(recipe);
                });
            }
            //const recipe = new Recipe(res.body.hits);
            //console.log(res.body.hits);
            //saveToDatabase(recipe);
        });
}

app.listen(PORT, () => console.log(`listening on ${PORT}`));



