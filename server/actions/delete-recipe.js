module.exports = function deleteRecipe(req, res) {
  const db = req.app.db;
  const recipeId = req.params.recipeId;
  if (!recipeId) {
    res.status(400).json({ message: 'recipeId not provided'});
    return;
  }
  db.removeItem(recipeId).then(() => {
    res.status(204);
  });
};
