import { clone, curry, __ } from 'ramda';
import camelCase from 'camelcase';

import { INVALID_NAMES, VALID_TYPES } from './constants.js';

const throwUnexpectedType = function (name, expected, actual, trackPath) {
  throw new Error(
    `Invalid type (${actual}) of attribute "${name}" (should be ${expected}) in ${trackPath}.`
  );
};

const detectType = function (value) {
  const typeOfValue = typeof value;
  if (typeOfValue !== 'object') return typeOfValue.toLowerCase();

  if (Array.isArray(value)) return 'array';

  if (!value) return 'null';

  return 'object';
};

const checkValueType = function (key, value, expected, trackPath) {
  const typeOfValue = detectType(value);
  expected = expected.toLowerCase();

  if (typeOfValue !== expected)
    throwUnexpectedType(key, expected, typeOfValue, trackPath);

  return true;
};

const execSchema = function (schema, attrFn, propFn, trackSegments = []) {
  const result = {};

  // attributes
  for (const attr in schema) {
    const value = schema[attr];
    if (value === undefined) continue;

    const nextValue = attrFn(attr, value, trackSegments);

    if (nextValue === undefined) continue;
    result[attr] = nextValue;
  }

  // child properties
  if (result.properties) {
    result.type = 'object';
    const nextProperties = {};
    const nextTrackSegs = [...trackSegments, 'properties'];
    for (const prop in result.properties) {
      const propSchema = result.properties[prop];
      if (propSchema === undefined) continue;

      checkValueType(prop, propSchema, 'object', nextTrackSegs);
      const nextSchema = propFn(prop, propSchema, nextTrackSegs);

      if (nextSchema === undefined) continue;

      nextProperties[prop] = nextSchema;
    }
    result.properties = nextProperties;
  }

  // items
  if (result.items) {
    result.type = 'array';
    result.items = validateSchema(result.items, [...trackSegments, 'items']);
  }

  // type
  if (!result.type) result.type = 'null';
  result.type = camelCase(result.type, { pascalCase: true });

  // default type
  if (result.type === 'Object' && !result.properties) result.properties = {};
  if (result.type === 'Array' && !result.items) result.items = {};

  return result;
};

const validateAttributeSchema = function (attr, value, segs = []) {
  const schemaPath = segs.join('.') || 'root';

  switch (attr) {
    case 'name':
      checkValueType(attr, value, 'string', schemaPath);
      return value.toLowerCase().trim();

    case 'type':
      checkValueType(attr, value, 'string', schemaPath);

      if (VALID_TYPES.indexOf(value.toLowerCase()) === -1)
        throw new Error(`Invalid type "${value}" in ${schemaPath}.`);

      return camelCase(value, { pascalCase: true });

    case 'properties':
      checkValueType(attr, value, 'object', schemaPath);
      return value;

    case 'items':
      checkValueType(attr, value, 'object', schemaPath);
      return value;

    default:
      return value;
  }
};

const validatePropertyObject = function (prop, schema, segs) {
  const schemaPath = segs.join('.') || 'root';

  if (INVALID_NAMES.indexOf(prop) !== -1)
    throw new Error(
      `You must not use property name "${prop}" in ${schemaPath}.`
    );

  return validateSchema(schema, [...segs, prop]);
};

const validateSchema = (schema, segs) =>
  execSchema(
    clone(schema),
    validateAttributeSchema,
    validatePropertyObject,
    segs
  );

export function Schema(raw) {
  if (!(this instanceof Schema)) {
    return new Schema(raw);
  }
  if (raw instanceof Schema) return new Schema(raw.raw);

  const data = validateSchema(raw);

  if (data.type !== 'Object')
    throw new Error(
      `Root schema must be an object, current type is ${data.type}.`
    );

  if (!data.name) throw new Error(`Root schema must has attribute "name".`);

  for (let key in data) this[key] = data[key];
}
