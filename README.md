# Rugo Schema

Validate and format data.

## Concept

There are three forms of schema:

- **final**: Standard schema, which is JSON Schema format, used to validation and transformation in 3rd application and library.
- **model**: Schema used to logical and feture. Inherit from **final**.
- **raw**: Schema used to store and easy to edit for human. Inherit from **model**.

## Usage

```js
import { Schema } from '@rugo-vn/schema';

const schema = new Schema(anyFormOfSchema);

schema.toRaw();
schema.toModel();
schema.toFinal();
```

## Forms

### Final

- Based on [JSON Schema](https://json-schema.org/) standard and [MongoDB JSON Schema](https://www.mongodb.com/docs/manual/reference/operator/query/jsonSchema/#omissions).
- Supported keywords:
  + `title`
  + `description`
  + `type`
  + `default`
  + `minumim`
  + `maximum`
  + `exclusiveMinimum`
  + `exclusiveMaximum`
  + `multipleOf`
  + `format`
  + `minLength`
  + `maxLength`
  + `pattern`
  + `enums`
  + `items`
  + `minItems`
  + `maxItems`
  + `additionalItems`
  + `contains`
  + `minContains`
  + `maxContains`
  + `uniqueItems`
  + `prefixItems`
  + `additionalProperties`
  + `patternProperties`
  + `required`
  + `allOf`
  + `unevaluatedProperties`
  + `if`
  + `then`
  + `propertyNames`
  + `minProperties`
  + `maxProperties`
- Supported types:
  + `string`
  + `number`
  + `object`
  + `array`
  + `boolean`
  + `null`
- Do not allow unknown keywords and types.
- Functional `default` will be skipped.

### Model

Inherit from **final** but additions:

- Supported types:
  + `json` -> `object`
  + `relation` -> `string`
  + `file` -> `string`
  + `text` -> `string`
  + `rich` -> `string`
  + `code` -> `string`
- Allow unknown keywords and types. They will be deleted when convert to **final** form.
- Be an object with has `type: "object"` and `properties` at root.
- Keywords, which contain underscore `_` as prefix, will be removed in **model** form.

### Raw

- Anything.

## Validation

```js
const nextData = await schema.validate(data[, fn]);
```

- It will use Ajv validation by default (in `final` form).
- If `fn` provided, it will using `fn` as validator.

```js
const validator = async function(data, schema) {
  /* ... */
  throw new ValidationError('msg');
  /* ... */
  return nextData;
}
```

## Templates

### Usage

When you work with multiple schemas, some of properties could be duplicated. So you can write them to modules for reusing. This is a reason this feature came:

```js
const [
  schema1,
  schema2,
  ...
] = Schema.process(raw1, raw2, raw3, ...);
```

Arguments of `process` method could be raw object, schema, or array of raw/schema. The return is an array of schema.

Special raw contains `_id` at root is a template schema. Any scope contains keyword `_ref` (value is `_id` of some template), will be merged (previous data priority) with template schema.

```js
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
    turn: { _ref: 'something' }
  }
};

const [ schema ] = Schema.process(raw1, raw2);
/*
schema = {
  name: 'bar',
  properties: {
    go: 'ahead',
    turn: {
      name: 'foo',
      properties: {
        go: 'away'
      }
    }
  }
}
*/
```

### Default template

We have some default template for using in Rugo Platform.

**user**

```js
const user = {
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
}
```

**fs**

```js
const fs = {
  _id: 'fs',
  driver: 'fs',
  properties: {
    name: 'string',
    mime: 'string',
    parent: 'relation',
    size: 'number',
  }
}
```

**time**

```js
const time = {
  _id: 'time',
  properties: {
    createdAt: {
      type: 'string',
      default: { $now: 'create' },
    },
    updatedAt: {
      type: 'string',
      default: { $now: 'update' },
    },
    version: {
      type: 'number',
      default: { $value: 1, $inc: 'update' },
    }
  }
}
```

## License

MIT.