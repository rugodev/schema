export const FINAL_KEYWORDS = [
  'title',
  'description',
  'type',
  'properties',
  'default',
  'minumim',
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
  'maxProperties'
];

export const FINAL_TYPES = [
  'string',
  'number',
  'object',
  'array',
  'boolean',
  'null'
];

export const FINAL_TRANSFORMS = [
  [{ type: 'string' }, { type: 'string', maxLength: 60 }],
  [{ type: 'text' }, { type: 'string' }],
  [{ type: 'code' }, { type: 'string' }],
  [{ type: 'relation' }, { type: 'string' }],
  [{ type: 'file' }, { type: 'string' }],
  [{ type: 'json' }, { type: 'object', properties: {} }]
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
        items: 'object'
      }
    },
    required: ['email']
  },
  {
    _id: 'fs',
    driver: 'fs',
    properties: {
      name: 'string',
      mime: 'string',
      parent: 'relation',
      size: 'number'
    }
  },
  {
    _id: 'time',
    properties: {
      createdAt: {
        type: 'string',
        default: { $now: 'create' }
      },
      updatedAt: {
        type: 'string',
        default: { $now: 'update' }
      },
      version: {
        type: 'number',
        default: { $value: 1, $inc: 'update' }
      }
    }
  }
];
