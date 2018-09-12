# GraphQL Normalized

Turn the results of your GraphQL queries into normal form.

# When you need normal form data

If you're buiding an app-like website, chances are your user will do more than just read some data. They may also modify it. When a user modifies data, it can be tricky to update the data consistently if the state is repeated in multiple places. This normally happens when state is representated in a tree structure. An example is the following two lists of friends and family:

```json
{
  "data": {
    "friends": [
     { "id": "A", "__typename": "User",  "name": "John" }
     { "id": "B", "__typename": "User",  "name": "Susan" }
    ],
    "family": [
     { "id": "A", "__typename": "User", "name": "John" }
    ]
  }
}
 ```

Here to change John's name we have to change it in two places. Now instead look at normal form where we reference relationships with their ID

```json
{
  "data": {
    "friends": ["A", "B"],
    "family": [ "A" ]
  },
  "nodes": {
    "User": {
      "A": { "id": "A", "name": "John" },
      "B": { "id": "B", "name": "Susan" }
    }
  }
}
```

If your data could exist in multiple parts of the UI and your users may modify that data or the data may change over time and you want the client to stay up to date, its highly recommended to use normal form.

# Usage

## 1. Add the normalized endpoint to your server

## 2. Creaate types for your client and store the data somewhere

## 3. Profit
