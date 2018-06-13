const fs = require('fs');
const { promisify } = require('util');
const access = promisify(fs.access);
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

module.exports = {
  access,
  mkdir,
  writeFile,
  readFile,
  unlink,
  constants: fs.constants,
};
