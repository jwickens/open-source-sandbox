pg-models
---

This package is an ORM (in the strictest sense of the term) for the pg library by Jonathan Wickens.
It leverages Flow types (byt could be adapted for Typescript) to check and expose types of models an
what one can do with instances of models.

Let's dive right into it with an example of what it is like to use the library to; in this example, we want
to create a new model for a pg table we have created. Let's assume the SQL for the table looks like this (yes,
this example is stolen (and adapted for simplicity) from the Virtual Phone implementation in the Channel service)

```sql
create table virtual_phone (
  id bigserial primary key, -- required pg-models field
  phone_number text unique not null,

  created_at timestamptz default current_timestamp not null,
  updated_at timestamptz default current_timestamp not null,
  deleted_at timestamptz -- it is recommended to have a deleted_at field in your table to leverage the safe delete from pg-models
);
```

### The model declaration
Quite like one would in C or C++, we need to declare what our model will looks like. In C/C++, we would typically
do this in a header file. Here, we do this in a `types` file. We would also typically drop this into our models folder.

As a convention, every model declaration is named: <ModelName>Decl. This makes it easy to see what we are dealing with
throughout the code.

```js
// src/models/VirtualPhone.types.js

// @flow
import type { PoolClient } from '/pg'

// your Decl should extend the ModelDecl class from pg-models so that flow will know what behavior to expect from your
// Model
const { ModelDecl } = require('/pg-models')

// Define in Flow what a typical record (en entry from the database must look like)
export type VirtualPhoneRecord = {|
  id: string,
  phoneNumber: string,
  createdAt: Date,
  updatedAt: Date,
  deletedAt?: Date
|}

// Model class Declarations must always extend ModelDecl and pass in as a first parameter to the Flow genric,
// what its records look like and as a second arg, itself.
export class VirtualPhoneDecl extends ModelDecl<VirtualPhoneRecord, VirtualPhoneDecl> {
  // example method
  sendSmsTo: ({ smsText: string, counterpartPhoneNumber: string }) => Promise<void>

  // example static method
  static purchaseNewPhoneNumber: () => Promise<{ phoneNumber: string }>
}
```

Now let's take a look at the accompanying implementation:

### The model declaration

Here's a sample implementation of what we just declared

```js
// src/models/VirtualPhone.js

// @flow

// Flow types imports
import type { Db } from '/pg'
import type { VirtualPhoneRecord, VirtualPhoneDecl } from './VirtualPhone.types'

// normal imports
const SQL = require('sql-template-strings')
const request = require('request-promise-native')
// A model class makers must be used to make pg-model classes as its name suggests
// ideally, this would be a function, but Flow won't allow [to my knowledge] generics of functions
const { ModelClassMaker } = require('pg-models')

// !!! this is some pg db instance that is imported. There are many ways to get a 
// db instance in this file.
const db = require('../db')
// //////////////////
// The actual code
// /////////////////

// the model class maker is instantiated by specifying its types using the types
// associated with this model in the generics fields
const modelClassMaker: ModelClassMaker<VirtualPhoneRecord, VirtualPhoneDecl> = new ModelClassMaker()

// We then create our actual model class by using the `make` method of the ModelClassMaker class.
// in it, we specify as first parameter, the pg valid database we are using, as well as the table_name
// this model refers to
const VirtualPhone = modelClassMaker.make(db, 'virtual_phone')

// example implementation of a static method
VirtualPhone.purchaseNewPhoneNumber = async () => {
  const phoneNumber = await request.get('https://example.com/find-available-phone-number')
  await request.post('https://example.com/purchase-phone-number', { phoneNumber })

  return phoneNumber
}

// an example implementation of our first behavioral 
VirtualPhone.prototype.sendSmsTo = async function({ smsText, counterpartPhoneNumber }) {
  return request.post('https://example.com/send-sms', {
    body: smsText,
    from: this.storedRecord.phoneNumber,
    to: counterpartPhoneNumber
  })
}

module.exports = VirtualPhone
```

### Using our new Model

Now that we have an actual Model and added behavior associated to it too, we can go ahead and use it.
Code like this would typically live inside of a controller

```js
// src/controllers/VirtualPhoneController.js

// @flow

const VirtualPhone = require('../models/VirtualPhone.js')

async function createVirtualPhone() {
  const phoneNumber = await VirtualPhone.purchaseNewPhone()
  const virtualPhone = await VirtualPhone.create({ phoneNumber })

  return virtualPhone.storedRecord
}

async function sendSmsFromTo({ smsText, virtualPhoneId, counterpartPhoneNumber }: {
  smsText: string,
  virtualPhoneId: string,
  counterpartPhoneNumber: string
})
  const virtualPhone = await VirtualPhone.getById(virtualPhoneId)
  virtualPhone.sendSmsTo({
    smsText, counterpartPhoneNumber
  })
})
``` 

Here, we see a few things and a few things that are happening aren't visible. In the first method, createVirtualPhone,
we use the static method we created to purchase a new phone number, then we use another static method (that we didn't write)
to actually create the instance in the database. We then return the `storedRecord`.

Instances of pg-models Models will always have two objects. 
1) the currentRecord
2) the storedRecord

When using any of the helper static methods to instantiate a new mode instance (as is advised) you will always have a
storedRecord. That means, pg-models assures that the instance you are playing with is backed by the database. That's good.

You may however want to change the record you have created an instance of (i.e. change phone number of a virtual phone).
In order to do that, one would simply change the currentRecord then save. Such a method would look like this:

```js
async function updateVirtualPhonePhoneNumber(virtualPhoneId: string, phoneNumber: string) {
  const virtualPhone = VirtualPhone.getById(virtualPhoneId)
  virtualPhone.currentRecord.phoneNumber = phoneNumber
  await this.save()

  // this will now be true. I.e. the currentRecord has been committed to the db
  expect(virtualPhone.storedRecord.phoneNumber === phoneNumber)
}
```

Now this might seem like we are really making two writes to the database when we could as well just have done one using upsert.
To do that, the code can be rewritten as such
```js
async function updateVirtualPhonePhoneNumber(virtualPhoneId: string, phoneNumber: string) {
  // this will not do any write to the database. That way, virtualPhone.storedRecord will not exist.
  // but virtualPhone.currentRecord will
  const virtualPhone = new VirtualPhone({ id: virtualPhoneId, phoneNumber })
  await this.save()

  // this will now also be true.
  expect(virtualPhone.storedRecord.phoneNumber === phoneNumber)
}
```

Now this is technically more efficient, but it's slightly less obvious what is going on as we don't explicitly change
the phoneNumber; it kind of happens under the hood. This is the kind of thing where we want to balance code 
readability/clarity and code efficiency. If the call is made every nano second, we do the fastest one, otherwise, the
first method might make more sense. Also, The code could even live inside of the Model itself while the controller
simply calls the method after having instantiated the object

## The API
API docs: [api-docs](docs/api-docs.md)
