DROP table if exists recipes;
/*
label = recipe.label;
    this.image = recipe.image;
    this.yield = recipe.yield;
    this.calories = Math.ceil(recipe.calories);
    this.totalTime = recipe.totalTime;
    this.ingredients = recipe.ingredients;
    this.dietLabels = recipe.dietLabels;
    this.healthLabels = recipe.healthLabels;
    recipeResults.push(this);
*/
CREATE TABLE recipes (
  id SERIAL PRIMARY KEY,
  label VARCHAR(100),
  image VARCHAR(200),
  yield INTEGER,
  calories INTEGER,
  total_time INTEGER,
  ingredients text[],
  diet_labels text[],
  health_labels text[]
)