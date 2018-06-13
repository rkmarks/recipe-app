module.exports = function listRecipes(req, res) {
  const db = req.app.db;
  db.getIndex().then((index) => {
    res.json(index);
  })
  .catch((err) => {
    res.status(500).json({ error: err.message });
  });
};
