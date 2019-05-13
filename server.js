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
//-----------------------------------------------------------------

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

//Constructor
function Recipe (recipe){
    this.label = recipe.label;
    this.image = recipe.image;
    this.yield = recipe.yield;
    this.calories = Math.ceil(recipe.calories);
    this.totalTime = recipe.totalTime;
    this.ingredients = recipe.ingredients;
    this.dietLabels = recipe.dietLabels;
    this.healthLabels = recipe.healthLabels;
    recipeResults.push(this);
}

//API Routes
app.get('/nameSearch', getRecipeByName);

//Path functions
function getRecipeByName(req, res){
    const url = `https://api.edamam.com/search?q=chicken&diet=balanced&app_id=${process.env.API_ID}&app_key=${process.env.API_KEY}`;

    return superagent.get(url)
        .then(res =>{
            console.log(res.body.hits);
        });
}

app.listen(PORT, () => console.log(`listening on ${PORT}`));



