/**
 * @flow
 */

const { Db, OrgScopedTable } = require('pg')
const { BaseModel } = require('../src/BaseModel')
const path = require('path')
const sqlDirectory = path.join(__dirname, './sql')

type MyModelRecord = {
  id: string,
  organizationId: string,
  createdAt: Date,
  updatedAt: Date,
  deletedAt: ?Date,
  myField: string
}

class Context {
  db: Db
  myModelTable: MyModelTable
  MyModel: Class<MyModel>
  isInitialized: Promise<void>
  constructor () {
    this.db = new Db({
      schemaVersion: 0.1,
      schemaBase: 'base_model_test',
      sqlDirectory
    })
    this.myModelTable = new MyModelTable(this)
    this.MyModel = MyModel.bindAppContext(this)
    this.isInitialized = this.initialize()
  }
  async initialize () {
    await this.db.sync()
  }
}

class MyModelTable extends OrgScopedTable<Context, MyModelRecord> {
  constructor (appContext: Context) {
    super(appContext, 'my_model')
  }
}

class MyModel extends BaseModel<Context, MyModelRecord, MyModel> {
  static staticProp = 'static'
  sayHi () {
    return this.storedRecord.myField
  }
  static sayStatic () {
    return 'static'
  }
  static sayStaticAgain () {
    return this.sayStatic()
  }
}
describe('BaseModel implemented as MyModel', () => {
  test('it doesnt blow up on initialization', async () => {
    expect.assertions(1)
    const c = new Context()
    try {
      await c.isInitialized
      expect(c.MyModel).toBeDefined()
    } finally {
      await c.db.close()
    }
  })

  test('it can say hi', async () => {
    expect.assertions(4)
    const c = new Context()
    try {
      await c.isInitialized
      const myModel = await c.MyModel.create({organizationId: '1', myField: 'hi there!'})
      expect(myModel).toBeInstanceOf(BaseModel)
      expect(myModel.appContext).toBeInstanceOf(Context)
      expect(myModel.db).toBeInstanceOf(Db)
      const hi = myModel.sayHi()
      expect(hi).toEqual('hi there!')
    } finally {
      await c.db.close()
    }
  })

  test('child classes can have static properties and static functions if they extend bindAppContext correctly', async () => {
    expect.assertions(3)
    const c = new Context()
    try {
      await c.isInitialized
      expect(c.MyModel.staticProp).toEqual('static')
      const staticThing = c.MyModel.sayStatic()
      expect(staticThing).toEqual('static')
      const staticThingAgain = c.MyModel.sayStaticAgain()
      expect(staticThingAgain).toEqual('static')
    } finally {
      await c.db.close()
    }
  })
})
