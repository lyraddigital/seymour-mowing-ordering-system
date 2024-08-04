const express = require("express");
const { createHandler } = require("graphql-http/lib/use/express");
const schema = require("./graphql/schema");
const getDashboardResolver = require("./graphql/resolvers/get-dashboard.resolver");

const root = {
  getDashboard: getDashboardResolver,
};

const app = express();

// Create and use the GraphQL handler.
app.all(
  "/graphql",
  createHandler({
    schema: schema,
    rootValue: root,
  })
);

app.listen(4000);
console.log("Running a GraphQL API server at http://localhost:4000/graphql");
