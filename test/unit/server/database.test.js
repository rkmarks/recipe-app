const assume = require('assume');

const asyncFs = require('../../../async-fs');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

assume.use(require('assume-sinon'));

describe('Database', () => {
  let sandbox;
  let Database;
  let mockAsyncFs;
  let db;

  before(() => {
    sandbox = sinon.createSandbox();
    mockAsyncFs = {
      access: sandbox.stub(),
      mkdir: sandbox.stub(),
      writeFile: sandbox.stub(),
      readFile: sandbox.stub(),
      unlink: sandbox.stub()
    };
    Database = proxyquire('../../../server/database', {
      '../async-fs': mockAsyncFs
    });
  });

  beforeEach(() => {
    db = new Database('./test-data');
  });

  after(() => {
    sandbox.restore();
  });

  it('is a function', () => {
    assume(Database).is.a('function');
  });

  describe('.init()', () => {

    it('creates a data folder and index file when none exists', async () => {
      mockAsyncFs.access.rejects(new Error('Folder doesnt exist'));
      mockAsyncFs.mkdir.resolves();
      mockAsyncFs.writeFile.resolves();
      await db.init();
      assume(mockAsyncFs.access).has.been.calledWith('./test-data');
      assume(mockAsyncFs.mkdir).has.been.calledWith('./test-data');
      assume(mockAsyncFs.writeFile).has.been.calledWith('./test-data/index.json', '{}');
    });

    it('properly initialized when data folder exists', async () => {
      mockAsyncFs.access.resolves();
      const getIndexStub = sandbox.stub(db, 'getIndex').resolves({});
      await db.init();
      assume(mockAsyncFs.access).has.been.calledWith('./test-data');
      assume(getIndexStub).has.been.called();
      getIndexStub.restore();
    });

    it('rejects when mkdir fails', async () => {
      mockAsyncFs.access.rejects(new Error('Folder doesnt exist'));
      mockAsyncFs.mkdir.rejects(new Error('mkdir failed'));
      await assume(db.init()).rejects();
    });

    it('rejects when writeFile fails', async () => {
      mockAsyncFs.access.rejects(new Error('Folder doesnt exist'));
      mockAsyncFs.mkdir.resolves();
      mockAsyncFs.writeFile.rejects(new Error('writeFile failed'));
      await assume(db.init()).rejects();
    });
    
    it('rejects when getIndex fails', async () => {
      mockAsyncFs.access.resolves();
      const getIndexStub = sandbox.stub(db, 'getIndex').rejects(new Error('getIndex failed'));
      await assume(db.init()).rejects();
      getIndexStub.restore();
    });
  });

  describe('.getIndex()', () => {
    it('resolves the index successfully', async () => {
      mockAsyncFs.readFile.resolves('{ "foo": "bar" }');
      const results = await db.getIndex();
      assume(results).deep.equals({ foo: 'bar' });
    });

    it('rejects if readFile fails', async () => {
      mockAsyncFs.readFile.rejects(new Error('readFile failed'));
      await assume(db.getIndex()).rejects();
    });

    it('rejects if index is corrupted', async () => {
      mockAsyncFs.readFile.resolves('{ ##fooDefinitelyNOtJson!$(<: "bar" }');
      await assume(db.getIndex()).rejects();
    });
  });

  describe('.getItem()', () => {
    it('resolves the item successfully', async () => {
      mockAsyncFs.readFile.resolves('{ "foo": "bar" }');
      const results = await db.getItem('foo');
      assume(results).deep.equals({ foo: 'bar' });
      assume(mockAsyncFs.readFile).has.been.calledWith('./test-data/foo.json');
    });

    it('rejects if readFile fails', async () => {
      mockAsyncFs.readFile.rejects(new Error('readFile failed'));
      await assume(db.getItem()).rejects();
    });

    it('rejects if item is corrupted', async () => {
      mockAsyncFs.readFile.resolves('{ ##fooDefinitelyNOtJson!$(<: "bar" }');
      await assume(db.getItem()).rejects();
    });
  });

  describe('.setItem()', () => {
    let isValidIdStub;
    let writeIndexStub;
    beforeEach(() => {
      db.index = {};
      isValidIdStub = sandbox.stub(db, 'isValidId');
      writeIndexStub = sandbox.stub(db, 'writeIndex');
    });
    
    afterEach(() => {
      isValidIdStub.restore();
      writeIndexStub.restore();
    });

    it('successfully saves an item', async () => {
      isValidIdStub.returns(true);
      mockAsyncFs.writeFile.resolves();
      writeIndexStub.resolves();
      await db.setItem('foo', { title: 'sometitle', foo: 'bar'});
      assume(isValidIdStub).has.been.calledWith('foo');
      assume(mockAsyncFs.writeFile).has.been.calledWith('./test-data/foo.json');
      assume(db.index).hasOwn('foo', 'sometitle');
      assume(writeIndexStub).has.been.called();
    });

    it('rejects if id is invalid', async () => {
      isValidIdStub.returns(false);
      await assume(db.setItem('#$*(*)', { title: 'sometitle', foo: 'bar'})).rejects();
    });

    it('rejects if writeFile fails', async () => {
      isValidIdStub.returns(true);
      mockAsyncFs.writeFile.rejects(new Error('writeFile failed'));
      await assume(db.setItem('foo', { title: 'sometitle', foo: 'bar'})).rejects();
    });

    it('rejects if writeIndex fails', async () => {
      isValidIdStub.returns(true);
      mockAsyncFs.writeFile.resolves();
      writeIndexStub.rejects(new Error('writeIndex failed'));
      await assume(db.setItem('foo', { title: 'sometitle', foo: 'bar'})).rejects();
    });
  });

  describe('.isValidId()', () => {
    it('return true for valid ids', () => {
      assume(db.isValidId('foo')).is.true();
      assume(db.isValidId('123')).is.true();
      assume(db.isValidId('a')).is.true();
      assume(db.isValidId('asdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrssdfrsasdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrs')).is.true();
      assume(db.isValidId('foo-bar')).is.true();
    });

    it('returns false for invalid ids', () => {
      assume(db.isValidId('')).is.false();
      assume(db.isValidId('foo&*$#')).is.false();
      assume(db.isValidId(' ')).is.false();
      assume(db.isValidId('ç')).is.false();
      assume(db.isValidId('asdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrssdfrsasdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrsasdfasdfrsa')).is.false();
    });
  });

  describe('.writeIndex()', () => {

    it('writes the file', async () => {
      mockAsyncFs.writeFile.resolves()
      await db.writeIndex();
      assume(mockAsyncFs.writeFile).has.been.calledWith('./test-data/index.json');
    });
  });

  describe('.removeItem()', () => {
    let writeIndexStub;
    beforeEach(() => {
      db.index = {
        'foo': { 'title': 'sometitle' }
      }
      writeIndexStub = sandbox.stub(db, 'writeIndex');
    });
    
    afterEach(() => {
      writeIndexStub.restore();
    });
    it('removes a file from the database', async () => {
      mockAsyncFs.unlink.resolves();
      await db.removeItem('foo');
      assume(mockAsyncFs.unlink).has.been.calledWith('./test-data/foo.json');
      assume(db.index).deep.equals({});
    });
  });

  describe('.itemExists()', () => {
    it('should return true if file exists', async () => {
      
    })
  })
});
