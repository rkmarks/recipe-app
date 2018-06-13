module.exports = function recipe(req, res) {
  const db = req.app.db;
  db.getItem(req.params.recipeId).then((recipe) => {
    res.json(recipe);
  })
  .catch((err) => {
    console.log(err);
    res.status(err.statusCode || 500).json({ error: err.message });
  });
};
