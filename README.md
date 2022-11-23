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

## License

MIT.