DROP table if exists recipes;

CREATE TABLE recipes (
  id SERIAL PRIMARY KEY,
  label VARCHAR(100),
  image VARCHAR(500) UNIQUE,
  url VARCHAR(500) UNIQUE,
  yield NUMERIC,
  calories INTEGER,
  total_time INTEGER,
  ingredients text[],
  diet_labels text[],
  health_labels text[],
  CONSTRAINT url_unique UNIQUE (url)
);