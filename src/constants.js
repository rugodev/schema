export const FINAL_KEYWORDS = [
  'title',
  'description',
  'type',
  'properties',
  'default',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf',
  'format',
  'minLength',
  'maxLength',
  'pattern',
  'enums',
  'items',
  'minItems',
  'maxItems',
  'additionalItems',
  'contains',
  'minContains',
  'maxContains',
  'uniqueItems',
  'prefixItems',
  'additionalProperties',
  'patternProperties',
  'required',
  'allOf',
  'unevaluatedProperties',
  'if',
  'then',
  'propertyNames',
  'minProperties',
  'maxProperties',
];

export const FINAL_TYPES = [
  'string',
  'number',
  'object',
  'array',
  'boolean',
  'null',
];

export const FINAL_TRANSFORMS = [
  [{ type: 'string' }, { type: 'string', maxLength: 60 }],
  [{ type: 'text' }, { type: 'string' }],
  [{ type: 'code' }, { type: 'string' }],
  [{ type: 'relation' }, { type: 'string' }],
  [{ type: 'file' }, { type: 'string' }],
  [{ type: 'json' }, { type: 'object', properties: {} }],
];

export const DEFAULT_TEMPLATES = [
  {
    _id: 'user',
    name: 'users',
    driver: 'mem',
    uniques: ['email'],
    properties: {
      email: 'string',
      password: 'string',
      apikey: 'string',
      perms: {
        items: 'json',
      },
    },
    required: ['email'],
  },
  {
    _id: 'fs',
    driver: 'fs',
    properties: {
      name: 'string',
      mime: 'string',
      parent: 'relation',
      size: 'number',
    },
  },
  {
    _id: 'time',
    properties: {
      createdAt: {
        type: 'datetime',
      },
      updatedAt: {
        type: 'datetime',
      },
      version: {
        type: 'number',
        default: 1,
      },
    },
  },
  {
    _id: 'post',
    properties: {
      title: 'string',
      slug: {
        type: 'string',
        default: {
          fn: 'slugify',
          from: 'title',
        },
      },
      content: 'string',
    },
  },
];

export const INVALID_NAMES = [
  '_id',
  'id',
  'createdAt',
  'updatedAt',
  'version',
  'type',
];

export const VALID_TYPES = [
  'string',
  'number',
  'boolean',
  'object',
  'array',
  'id',
  'date',
];

export const VALID_MONGOOSE_ATTRS = [
  'type',
  'items',
  'default',
  'required',
  'unique',
  'min',
  'max',
  'enum',
  'match',
  'minLength',
  'maxLength',
];
