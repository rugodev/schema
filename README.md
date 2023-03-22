# Rugo Schema

Schema conversion.

## Rugo Schema

All services of the Rugo Ecosystem are using Rugo Schema as official data modeling.

Inspired of JSON Schema, it shoule be:

```js
const schema = new Schema({
  name: /* tableName, name of schema, use for naming collection */,
  icon: /* icon name of table */,
  /* other custom attributes */,
  type: 'Object', /* by default, it is an object */,
  properties: {
    fieldA: {
      type: 'TypeA', /* some attributes */,
      default: 'Value', /* default when it meet undefined value */,
      required: true, /* if this field is requried */,
      unique: true, /* if this field if unique */,
    },
    fieldB: {
      type: 'Array',
      items: {
        /* ... */,
      },
    },
    fieldC: {
      type: 'Object',
      properties: {
        /* ... */
      }
    },
    /* we have more default properties likes: */,
    id: { type: 'Id' },
    createdAt: { type: 'Date' },
    updatedAt: { type: 'Date' },
    version: { type: 'Number' },
  }
});
```

It will throws an error if meet invalid schema.

## Types

All types should be write in PascalCase.

**`Object`**

**`Id`**

- `ref` the name of table that you want to link.
- `lookup` the property of row that you want to show when linked.

## Handles

## Conversion

### To JSON Schema

### To Mongoose Schema

## License

MIT.
