import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { clone } from 'ramda';
import { FINAL_KEYWORDS, FINAL_TRANSFORMS, FINAL_TYPES } from './constants.js';
import { ajvError } from '@rugo-vn/exception';

const EmptyFn = () => {};

const isSchemaObject = function (schema) {
  return !!schema && typeof schema === 'object' && !Array.isArray(schema);
};

const transformKeyword = function (keyword, value) {
  if (keyword === 'properties') {
    return {
      type: 'object',
      properties: value
    };
  }

  if (keyword === 'items') {
    return {
      type: 'array',
      items: value
    };
  }

  return {
    [keyword]: value
  };
};

const cleanKeyword = function (keyword, value) {
  for (const transform of FINAL_TRANSFORMS) {
    if (transform[0][keyword] !== value) { continue; }

    return transform[1];
  }

  if (FINAL_KEYWORDS.indexOf(keyword) === -1) { return undefined; }

  if (keyword === 'type' && FINAL_TYPES.indexOf(value) === -1) { return undefined; }

  return { [keyword]: value };
};

const walk = function (schema, fn = EmptyFn, traces = []) {
  if (typeof schema === 'string') { schema = { type: schema }; }

  if (!isSchemaObject(schema)) { return; }

  let nextSchema = {};
  for (const keyword in schema) {
    const value = schema[keyword];
    const nextSchemaPart = fn(keyword, value, traces);

    if (nextSchemaPart === undefined) { continue; }

    if (keyword === 'properties') {
      const nextProps = {};
      for (const prop in value) {
        const nextPropSchema = walk(value[prop], fn, [...traces, keyword, prop]);
        if (nextPropSchema === undefined) { continue; }
        nextProps[prop] = nextPropSchema;
      }
      nextSchemaPart.properties = nextProps;
    }

    if (keyword === 'items') {
      nextSchemaPart.items = walk(value, fn, [...traces, keyword]);
    }

    if (nextSchemaPart !== undefined) {
      nextSchema = {
        ...nextSchema,
        ...nextSchemaPart
      };
    }
  }

  return nextSchema;
};

export function Schema (raw) {
  if (!(this instanceof Schema)) { return new Schema(raw); }
  if (raw instanceof Schema) return new Schema(raw.raw);

  this.raw = clone(raw);

  this.ajv = new Ajv({ removeAdditional: true, useDefaults: true });
  addFormats(this.ajv);
}

Schema.prototype.toRaw = function () {
  return clone(this.raw);
};

Schema.prototype.toModel = function () {
  if (!isSchemaObject(this.raw)) {
    return {
      type: 'object',
      properties: {}
    };
  }

  return walk(this.raw, transformKeyword);
};

Schema.prototype.toFinal = function () {
  const modelSchema = this.toModel();

  const finalSchema = walk(modelSchema, cleanKeyword);

  return finalSchema;
};

Schema.prototype.validate = function (data) {
  const nextData = clone(data);
  const finalSchema = this.toFinal();
  const validate = this.ajv.compile(finalSchema);

  validate(nextData);

  if (validate.errors && Array.isArray(validate.errors) && validate.errors.length) {
    throw ajvError(validate.errors[0]);
  }

  return nextData;
};

Schema.prototype.walk = function (fn) {
  return walk(this.toModel(), fn);
};
