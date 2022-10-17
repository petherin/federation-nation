const { ApolloServer, gql } = require("apollo-server");
const { addColor, countColors, findColors, findColor } = require("./lib");
const { buildSubgraphSchema } = require("@apollo/subgraph");

const typeDefs = gql`
  scalar DateTime

  type Color {
    id: ID!
    title: String!
    value: String!
    created: DateTime!
    createdBy: User!
  }

    extend type User @key(fields: "email") {
        email: ID! @external
        postedColors: [Color!]!
    }

  type Query {
    totalColors: Int!
    allColors: [Color!]!
  }

union ColorPayload = Error | Color

type Error {
    message: String
}

type Mutation {
    addColor(title: String! value: String!): ColorPayload!
}
`;

const resolvers = {
  Query: {
    totalColors: (_, __, { countColors }) => countColors(),
    allColors: (_, __, { findColors }) => findColors(),
  },
  Mutation: {
    addColor: (
        _,
        { title, value}, 
        {currentUser, addColor }
        ) => {
        if (!currentUser) {
            return {
                message: "You must be logged in to add a color"
            };
        }
        const color = addColor(currentUser, title, value);
        return color;
    }
  },
  ColorPayload: {
    __resolveType: parent => 
    parent.message ? "Error" : "Color"
  },
  User: {
    postedColors: ({email}, _, {findColors}) =>
     findColors(email)
}
};

const start = async () => {
  const server = new ApolloServer({
    schema: buildSubgraphSchema({
        typeDefs,
        resolvers
    }),
    context: ({ req }) => ({
      countColors,
      findColors,
      addColor,
      findColor,
    }),
  });

  server.listen(process.env.PORT).then(({ url }) => {
    console.log(`       🎨 🖍  - Color service running at: ${url}`);
  });
};

start();
