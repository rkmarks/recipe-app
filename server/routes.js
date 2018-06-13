module.exports = function routes(app) {
  app.get('/', (req, res) => {
    res.send('Hello World');
  });
  //All Recipes
  app.get('/api/recipes', require('./actions/list-recipes'));
  //Single Recipe
  app.get('/api/recipe/:recipeId', require('./actions/recipe'));
  app.put('/api/recipe', require('./actions/create-recipe'));
  app.post('/api/recipe/:recipeId', require('./actions/update-recipe'));
  app.delete('/api/recipe/:recipeId', require('./actions/delete-recipe'));
}