import camelCase from 'camelcase';
import { clone } from 'ramda';
import { Schema as MongooseSchema } from 'mongoose';

import {
  INVALID_NAMES,
  VALID_MONGOOSE_ATTRS,
  VALID_TYPES,
} from './constants.js';

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
    if (PROTOTYPE_ATTRS.indexOf(attr) !== -1) continue;

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
      const nextSchema = execSchema(
        propFn(prop, propSchema, nextTrackSegs),
        attrFn,
        propFn,
        [...nextTrackSegs, prop]
      );

      if (nextSchema === undefined) continue;

      nextProperties[prop] = nextSchema;
    }
    result.properties = nextProperties;
  }

  // items
  if (result.items) {
    result.type = 'array';
    result.items = execSchema(result.items, attrFn, propFn, [
      ...trackSegments,
      'items',
    ]);
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

  return schema;
};

const validateSchema = (schema, segs) =>
  execSchema(
    clone(schema),
    validateAttributeSchema,
    validatePropertyObject,
    segs
  );

const transformSchema = (schema, methods) =>
  execSchema(
    schema,
    (attr, value) => {
      if (methods[attr]) return methods[attr](value);
      return value;
    },
    (_, schema) => {
      return schema;
    }
  );

const toMongoose = (srcSchema) => {
  const dstSchema = {};

  // attributes
  for (const attr in srcSchema) {
    if (VALID_MONGOOSE_ATTRS.indexOf(attr) === -1) continue;

    const value = srcSchema[attr];
    if (value === undefined) continue;

    dstSchema[attr] = value;
  }

  if (srcSchema.properties) {
    const nextType = {};
    for (const prop in srcSchema.properties) {
      const propSchema = srcSchema.properties[prop];
      const nextSchema = toMongoose(propSchema);

      if (!nextSchema) continue;

      if (nextSchema.type === 'Array') {
        const arrSchema = toMongoose(nextSchema.items);
        nextSchema.type = arrSchema ? [arrSchema] : [];
        delete nextSchema.items;
        nextSchema.default ||= undefined;
      }

      nextType[prop] = nextSchema;
    }
    dstSchema.type = nextType;
  }

  if (dstSchema.type === 'Null') return undefined;
  if (dstSchema.type === 'Id') dstSchema.type = 'ObjectId';
  dstSchema._id = false;

  return dstSchema;
};

export function Schema(...args) {
  if (!(this instanceof Schema)) {
    return new Schema(...args);
  }

  const raw = args[0];
  if (raw instanceof Schema) return new Schema(...args);

  // validate schema
  const data = validateSchema(raw);
  if (data.type !== 'Object')
    throw new Error(
      `Root schema must be an object, current type is ${data.type}.`
    );
  if (!data.name) throw new Error(`Root schema must has attribute "name".`);

  // transform schema
  const methods = args[1] || {};
  const nextData = transformSchema(data, methods);

  // assign result
  for (let key in nextData) this[key] = nextData[key];
}

Schema.prototype.toMongoose = function () {
  return new MongooseSchema(toMongoose(this).type, {
    timestamps: true,
    versionKey: 'version',
  });
};

Schema.prototype.clone = function () {
  const obj = {};
  for (const attr in this) {
    if (PROTOTYPE_ATTRS.indexOf(attr) !== -1) continue;

    obj[attr] = clone(this[attr]);
  }

  return obj;
};

Schema.prototype.toJSON = function (format = false) {
  return format
    ? JSON.stringify(this.clone(), 0, 2)
    : JSON.stringify(this.clone());
};

const PROTOTYPE_ATTRS = Object.keys(Schema.prototype);
