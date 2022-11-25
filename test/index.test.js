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
    expect(new Schema({ _name: 'foo' }).toModel()).to.not.has.property('name');
  });

  it('should convert to final', async () => {
    const rawSchema = {
      _hidden: 'hi',
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
            wrong: 'superidol',
          }
        }
      }
    };

    const finalSchema = new Schema(rawSchema).toFinal();

    expect(finalSchema._hidden).to.be.eq(undefined);
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
    } catch(errs) {
      expect(errs[0]).to.has.property('message', 'Document failed validation in operation "type"');
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

  it('should template', async () => {
    const raw1 = {
      _id: 'something',
      name: 'foo',
      properties: {
        go: 'away'
      }
    };
    
    const raw2 = {
      name: 'bar',
      properties: {
        go: 'ahead',
        turn: { _ref: 'something' },
        skip: { _ref: 'notthing' },
      },
      _ref: ['time', 'fs'],
    };
    
    const [ schema ] = Schema.process(new Schema(raw1), [raw2], 0, 1);
    const schemaRaw = schema.raw;

    expect(path(['properties', 'turn', 'properties', 'go'], schemaRaw)).to.be.eq('away');
    expect(Object.keys(path(['properties', 'skip'], schemaRaw)).length).to.be.eq(0);
    expect(path(['properties', 'createdAt', 'default'], schemaRaw)).to.has.property('$now', 'create');
    expect(path(['properties', 'size'], schemaRaw)).to.be.eq('number');
  });
});
