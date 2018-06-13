module.exports = function server() {
  const express = require('express');
  const Database = require('./database');
  const bodyParser = require('body-parser');

  const app = express();
  app.use(bodyParser.json());
  app.db = new Database();
  app.db.init().then(() => {
    require('./routes')(app);
    return app.listen(3000, () => {
      console.log('running on port 3000');
    });
  })
  .catch((err) => {
    throw err;   
  });
}
