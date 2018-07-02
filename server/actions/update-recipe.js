module.exports = function updateRecipe(req, res) {
  const db = req.app.db;
  const recipeId = req.params.recipeId;
  if (!recipeId) {
    res.status(400).json({ message: 'recipeId not provided'});
    return;
  }
  db.itemExists(recipeId).then((exists) => {
    if(!exists) {
      res.status(404).json({ message: 'recipe does not exist'});
      return;
    }
    db.setItem(recipeId, req.body).then(() => {
      res.status(204);
    }, (err) => {
      res.status(500).json({ message: err });
    });
  });
};
