DROP table if exists recipes, users;

CREATE TABLE recipes (
  id SERIAL PRIMARY KEY,
  label VARCHAR(100),
  image VARCHAR(500) UNIQUE,
  url VARCHAR(500) UNIQUE,
  yield NUMERIC,
  calories NUMERIC,
  total_time NUMERIC,
  ingredients text[],
  diet_labels text[],
  health_labels text[],
  CONSTRAINT url_unique UNIQUE (url)
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  password VARCHAR(100)
)