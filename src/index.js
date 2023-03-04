import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { clone, curry, flatten, mergeDeepLeft, path } from 'ramda';
import {
  DEFAULT_TEMPLATES,
  FINAL_KEYWORDS,
  FINAL_TRANSFORMS,
  FINAL_TYPES,
} from './constants.js';
import { ajvError } from '@rugo-vn/exception';

const EmptyFn = () => {};

const isSchemaObject = function (schema) {
  return !!schema && typeof schema === 'object' && !Array.isArray(schema);
};

const transformKeyword = function (keyword, value) {
  if (keyword[0] === '_') {
    return undefined;
  }

  if (keyword === 'properties') {
    return {
      type: 'object',
      properties: value,
    };
  }

  if (keyword === 'items') {
    return {
      type: 'array',
      items: value,
    };
  }

  return {
    [keyword]: value,
  };
};

const cleanKeyword = function (keyword, value) {
  for (const transform of FINAL_TRANSFORMS) {
    if (transform[0][keyword] !== value) {
      continue;
    }

    return transform[1];
  }

  if (FINAL_KEYWORDS.indexOf(keyword) === -1) {
    return undefined;
  }

  if (keyword === 'type' && FINAL_TYPES.indexOf(value) === -1) {
    return undefined;
  }

  if (
    keyword === 'default' &&
    value &&
    typeof value === 'object' &&
    Object.keys(value).some((v) => v === 'fn')
  ) {
    return;
  }

  return { [keyword]: value };
};

const walk = function (schema, fn = EmptyFn, traces = []) {
  if (typeof schema === 'string') {
    schema = { type: schema };
  }

  if (!isSchemaObject(schema)) {
    return;
  }

  let nextSchema = {};
  for (const keyword in schema) {
    const value = schema[keyword];
    const nextSchemaPart = fn(keyword, value, traces);

    if (nextSchemaPart === undefined) {
      continue;
    }

    if (keyword === 'properties') {
      const nextProps = {};
      for (const prop in value) {
        const nextPropSchema = walk(value[prop], fn, [
          ...traces,
          keyword,
          prop,
        ]);
        if (nextPropSchema === undefined) {
          continue;
        }
        nextProps[prop] = nextPropSchema;
      }
      nextSchemaPart.properties = nextProps;
    }

    if (keyword === 'items') {
      nextSchemaPart.items = walk(value, fn, [...traces, keyword]);
    }

    if (nextSchemaPart !== undefined) {
      nextSchema = mergeDeepLeft(nextSchema, nextSchemaPart);
    }
  }

  return nextSchema;
};

const fillRefTemplate = function (templateMap, keyword, value) {
  if (keyword !== '_ref') {
    return { [keyword]: value };
  }

  const values = flatten([value]);

  let nextValue = {};
  for (const value of values) {
    if (!templateMap[value]) {
      continue;
    }

    nextValue = mergeDeepLeft(nextValue, templateMap[value]);
  }

  return nextValue;
};

export function Schema(raw) {
  if (!(this instanceof Schema)) {
    return new Schema(raw);
  }
  if (raw instanceof Schema) return new Schema(raw.raw);

  this.raw = clone(raw);
}

Schema.prototype.toRaw = function () {
  return clone(this.raw);
};

Schema.prototype.toModel = function () {
  if (!isSchemaObject(this.raw)) {
    return {
      type: 'object',
      properties: {},
    };
  }

  return walk(this.raw, transformKeyword);
};

Schema.prototype.toFinal = function () {
  const modelSchema = this.toModel();

  const finalSchema = walk(modelSchema, cleanKeyword);

  return finalSchema;
};

Schema.prototype.validate = function (data, isTransform = true) {
  const ajv = new Ajv({
    coerceTypes: true,
    removeAdditional: true,
    ...(isTransform ? { useDefaults: true } : {}),
  });
  addFormats(ajv);

  const nextData = clone(data);
  const finalSchema = this.toFinal();
  const validate = ajv.compile(finalSchema);

  validate(nextData);

  if (
    validate.errors &&
    Array.isArray(validate.errors) &&
    validate.errors.length
  ) {
    throw validate.errors.map((raw) => {
      raw.value = path(
        raw.instancePath.split('/').filter((i) => i),
        data
      );
      return ajvError(raw);
    });
  }

  return nextData;
};

Schema.prototype.walk = function (fn) {
  return walk(this.toModel(), fn);
};

Schema.walk = walk;

Schema.process = function (...args) {
  args = [...DEFAULT_TEMPLATES, ...flatten(args)];

  const raws = [];
  for (const arg of args) {
    raws.push(new Schema(arg).raw);
  }

  const templateMap = {};
  const schemaRaws = [];
  for (const raw of raws) {
    if (raw._id) {
      templateMap[raw._id] = raw;
      delete templateMap[raw._id]._id;
      continue;
    }

    schemaRaws.push(raw);
  }

  const fillRef = curry(fillRefTemplate)(templateMap);
  const schemas = [];
  for (const raw of schemaRaws) {
    if (!isSchemaObject(raw)) {
      continue;
    }

    const nextRaw = walk(raw, fillRef);
    schemas.push(new Schema(nextRaw));
  }

  return schemas;
};

export function extractSchema(rawSchema) {
  const config = {};
  const schema = {};

  for (const key in rawSchema) {
    if (key[0] === '_') {
      config[key.substring(1)] = rawSchema[key];
    } else {
      schema[key] = rawSchema[key];
    }
  }

  return [config, schema];
}
