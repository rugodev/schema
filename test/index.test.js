/* eslint-disable */

import { createConnection, Schema as MongooseSchema } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { assert, expect } from 'chai';
import { Schema } from '../src/schema.js';

const COMPLEX_SCHEMA = {
  name: 'PeOpLe',
  abc: 'Def',
  ghi: 123,
  jkl: true,
  mno: false,
  pqr: undefined,
  properties: {
    name: { type: 'string', maxlength: 12, minlength: 13 },
    pets: {
      type: 'array',
      items: {
        properties: {
          name: { type: 'string' },
          kind: { type: 'string' },
          age: { type: 'number' },
          more: { type: 'object' },
          tags: { type: 'array' },
          joys: { type: 'array', default: [] },
        },
      },
    },
    non: undefined,
  },
};

const DB_NAME = 'test';

describe('Rugo Schema test', () => {
  let mongod;
  let conn;

  before(async () => {
    // mongo
    mongod = await MongoMemoryServer.create({
      instance: {
        dbName: DB_NAME,
      },
    });

    conn = await createConnection(mongod.getUri()).asPromise();
  });

  after(async () => {
    await conn.close();
    await mongod.stop();
  });

  it('should validate schema before create: name ', async () => {
    // invalid name
    try {
      new Schema({ name: true });
      assert.fail('should throw error');
    } catch (err) {
      expect(err).to.has.property(
        'message',
        'Invalid type (boolean) of attribute "name" (should be string) in root.'
      );
    }

    // invalid schema
    try {
      new Schema({ name: 'abc' });
      assert.fail('should throw error');
    } catch (err) {
      expect(err).to.has.property(
        'message',
        'Root schema must be an object, current type is Null.'
      );
    }

    // required name
    try {
      new Schema({ type: 'Object' });
      assert.fail('should throw error');
    } catch (err) {
      expect(err).to.has.property(
        'message',
        'Root schema must has attribute "name".'
      );
    }

    // invalid property
    try {
      Schema({ properties: { name: false } });
      assert.fail('should throw error');
    } catch (err) {
      expect(err).to.has.property(
        'message',
        'Invalid type (boolean) of attribute "name" (should be object) in properties.'
      );
    }

    // invalid property
    try {
      Schema({ properties: { name: { type: null } } });
      assert.fail('should throw error');
    } catch (err) {
      expect(err).to.has.property(
        'message',
        'Invalid type (null) of attribute "type" (should be string) in properties.name.'
      );
    }

    // invalid property type
    try {
      Schema({ properties: { name: { type: 'mytype' } } });
      assert.fail('should throw error');
    } catch (err) {
      expect(err).to.has.property(
        'message',
        'Invalid type "mytype" in properties.name.'
      );
    }

    // invalid nested property
    try {
      new Schema({ properties: { name: { type: [] } } });
      assert.fail('should throw error');
    } catch (err) {
      expect(err).to.has.property(
        'message',
        'Invalid type (array) of attribute "type" (should be string) in properties.name.'
      );
    }

    // invalid property name
    try {
      new Schema({ properties: { id: { type: 'string' } } });
      assert.fail('should throw error');
    } catch (err) {
      expect(err).to.has.property(
        'message',
        'You must not use property name "id" in properties.'
      );
    }
  });

  it('should create a schema', async () => {
    const schema = new Schema(COMPLEX_SCHEMA);

    // console.log(JSON.stringify(schema, 0, 2));

    expect(schema).to.has.property('name', 'people');
    expect(schema).to.has.property('abc', 'Def');
    expect(schema).to.has.property('ghi', 123);
    expect(schema).to.has.property('jkl', true);
    expect(schema).not.to.has.property('pqr');
    expect(schema.properties.pets.items.properties.name).to.has.property(
      'type',
      'String'
    );

    expect(schema.properties.pets.items.properties.tags).to.has.property(
      'items'
    );
  });

  it('should manipulate schema', async () => {
    const schema = new Schema(
      {
        name: 'persons',
        properties: {
          link: { type: 'Object', ref: 'gogo' },
          slug: { type: 'String', default: 'somevalue' },
        },
      },
      {
        name: (val) => `prefix.${val}`,
        ref: (val) => `newPrefix.${val}`,
        default: () => undefined,
      }
    );

    expect(schema).to.has.property('name', 'prefix.persons');
    expect(schema.properties.link).to.has.property('ref', 'newPrefix.gogo');
  });

  it('should convert to mongoose schema', async () => {
    const schema = new Schema(COMPLEX_SCHEMA);

    const mongooseSchema = schema.toMongoose();
    // console.log(JSON.stringify(mongooseSchema, 0, 2));

    const Model = conn.model(
      schema.name,
      MongooseSchema(mongooseSchema),
      schema.name
    );

    const doc = await Model.create({
      name: 'abc',
      pets: [{ name: 'Foo', age: 12 }],
    });

    // console.log(doc);

    expect(doc.pets[0]).to.has.property('joys');
  });

  it("should user's schema", async () => {
    const keySchema = new Schema({
      name: '_keys',
      properties: {
        data: { type: 'String' },
        hash: { type: 'String' },
        prev: { type: 'Id', ref: '_keys' },
      },
    });

    const userSchema = new Schema({
      name: 'users',
      properties: {
        email: { type: 'String', required: true, unique: true },
        credentials: {
          type: 'Array',
          items: {
            properties: {
              key: { type: 'Id', ref: '_keys' },
              perms: { type: 'Object' },
            },
          },
        },
      },
    });

    expect(userSchema.toMongoose() instanceof MongooseSchema).to.be.eq(true);
  });
});
