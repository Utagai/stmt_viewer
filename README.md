# `stmt`

Prints Chase transactions CSVs in a human-readable ASCII (+ colors) format.

## Example

![demo](./rsrc/demo.png)

## CLI

This program is simple. The CLI signature is just this:

```
stmt CONFIG_FILE CSV_STATEMENT
```

## Config Format

This binary takes a config file as its first argument. The config file has the
following schema, as described by Typescript type definitions:

```typescript
export type Config = {
  categories: Category[];
  categoryMappings: CategoryMapping[];
  descriptionMappings: DescriptionMapping[];
};

export type Category = string;

type CategoryMapping = {
  // from is a regular expression that will be used to match against the
  // original category.
  from: string;
  to: Category;
};

type DescriptionMapping = {
  // from is a regular expression that will be used to match against the
  // original description.
  from: string;
  to: Category;
};
```
