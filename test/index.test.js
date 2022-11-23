/* eslint-disable */

import { assert, expect } from "chai";
import { path } from "ramda";
import { Schema } from "../src/index.js";

describe('Schema test', () => {
  it('should to create a schema', async () => {
    expect(Schema().toRaw()).to.be.eq(undefined);
    expect(new Schema(new Schema()).toRaw()).to.be.eq(undefined);
    expect(new Schema(123).toRaw()).to.be.eq(123);

    const obj = { name: 'foo' };
    expect(new Schema(obj).toRaw()).to.be.not.eq(obj);
    expect(new Schema(obj).toRaw()).to.has.property('name', 'foo');
  });

  it('should convert to model', async () => {
    expect(new Schema().toModel()).to.has.property('type', 'object');
    expect(new Schema(null).toModel()).to.has.property('type', 'object');
    expect(new Schema(0).toModel()).to.has.property('type', 'object');
    expect(new Schema('name').toModel()).to.has.property('type', 'object');
    expect(new Schema([1, 2, 3]).toModel()).to.has.property('type', 'object');
    expect(new Schema({ name: 'foo' }).toModel()).to.has.property('name', 'foo');
  });

  it('should convert to final', async () => {
    const rawSchema = {
      name: 'foo',
      properties: {
        name: 'string',
        age: 'number',
        parent: {
          type: 'array',
          items: {
            properties: {
              name: 'string',
            }
          }
        },
        education: {
          properties: {
            school: {
              type: 'string',
              pattern: 'abc.*'
            },
            year: 'number',
            detail: {
              type: 'text'
            },
            some: null,
            wrong: 'superidol'
          }
        }
      }
    };

    const finalSchema = new Schema(rawSchema).toFinal();

    expect(path(['properties', 'name', 'type'], finalSchema)).to.be.eq('string');
    expect(path(['properties', 'education', 'properties', 'year', 'type'], finalSchema)).to.be.eq('number');
    expect(path(['properties', 'education', 'properties', 'detail', 'type'], finalSchema)).to.be.eq('string');
    expect(path(['properties', 'education', 'properties', 'school', 'pattern'], finalSchema)).to.be.eq('abc.*');
  });

  it('should validate data', async () => {
    expect(new Schema({properties: {name: 'string'}}).validate({ name: 'foo' })).to.has.property('name', 'foo');
    expect(new Schema({properties: {name: {}}}).validate({ name: 'foo' })).to.has.property('name', 'foo');
    expect(new Schema({properties: {}}).validate({ name: 'foo' })).to.has.property('name', 'foo');

    try {
      new Schema({properties: { age: 'number' }}).validate({ age: 'foo' });
      assert.fail('should error');
    } catch(err) {
      expect(err).to.has.property('message', 'Document failed validation in operation "type"');
    }
  });

  it('should walk', async () => {
    const traces = [];
    
    new Schema({
      name: 'abc',
      driver: 'def',
      properties: {
        link: { type: 'relation', ref: 'ghi' },
      }
    }).walk((keyword, value, t) => {
      traces.push(t);
      return { [keyword]: value };
    });

    expect(traces).to.has.property('length', 6);
  });
});
