const asyncFs = require('../async-fs');


module.exports = class Database {

  constructor(dataPath = './data') {
    this.dataPath = dataPath;
  }

  async init() {
    try {
      await asyncFs.access(this.dataPath, asyncFs.constants.R_OK | asyncFs.constants.W_OK);
    } catch(accessError) {
      await asyncFs.mkdir(this.dataPath);
      await asyncFs.writeFile(`${this.dataPath}/index.json`, '{}');
      this.index = {};
      return;
    }
    this.index = await this.getIndex();
  }

  async getIndex() {
    const strIndex = await asyncFs.readFile(`${this.dataPath}/index.json`, 'utf8');
    return JSON.parse(strIndex);
  }

  async getItem(id) {
    try {
      const strData = await asyncFs.readFile(`${this.dataPath}/${id}.json`, 'utf8');
      return JSON.parse(strData);
    } catch (e) {
      if (e && e.code === 'ENOENT') {
        const err = new Error('Item does not exist');
        err.statusCode = 404;
        throw err;
      }
      throw e;
    }
  }

  async setItem(id, data) {
    if (!this.isValidId(id)) {
      throw new Error('Invalid Id. Must be alphanumeric and between 1 - 255 characters');
    } 
    await asyncFs.writeFile(`${this.dataPath}/${id}.json`, JSON.stringify(data));
    this.index[id] = data.title;
    await this.writeIndex();
  }

  isValidId(id) {
    return id !== 'index' && /^[a-z0-9\-]{1,255}$/i.test(id);
  }

  async writeIndex() {
    await asyncFs.writeFile(`${this.dataPath}/index.json`, JSON.stringify(this.index));
  }

  async removeItem(id) {
    await asyncFs.unlink(`${this.dataPath}/${id}.json`);
    delete this.index[id];
    await this.writeIndex();
  }

  async itemExists(id) {
    try {
      await asyncFs.access(`${this.dataPath}/${id}.json`, asyncFs.constants.R_OK)
    } catch (e) {
      return false;
    }
    return true;
  }
};
