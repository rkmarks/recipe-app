module.exports = function createRecipe(req, res) {
  const db = req.app.db;
  const body = req.body;
  let count = 0;
  let id;
  do {
    id = createId(body.title, count === 0 ? '' : count);
    count++;
  } while (db.itemExists(id));
  db.setItem(id, body).then(() => {
    res.status(201).json({ id });
  });
};

function createId(title, prefix = '') {
  return (prefix + title.replace(/[^a-z0-9\-]/g, '')).substr(0, 255);
}
