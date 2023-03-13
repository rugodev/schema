/* eslint-disable */

import { assert, expect } from 'chai';
import { Schema } from '../src/schema.js';

describe('Rugo Schema test', () => {
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
    const schema = new Schema({
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
              type: { type: 'string' },
              age: { type: 'number' },
              more: { type: 'object' },
              tags: { type: 'array' },
            },
          },
        },
        non: undefined,
      },
    });

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
});
