const { ApolloServer, gql } = require("apollo-server");
const lifts = require("./lift-data.json");
const { buildSubgraphSchema} = require("@apollo/subgraph");

const typeDefs = gql`
  type Lift {
    id: ID!
    name: String!
    status: LiftStatus!
    capacity: Int!
    night: Boolean!
    elevationGain: Int!
    # This new trailAccess field returns a Trail,
    # so we need the trail service to resolve it.
    # How do we do that?
    #
    # 1. Trail type in trail service has an @key directive to set its lookup field as 'id'.
    # 2. Add __resolveReference to trail service so it can return a trail when another
    # another service refers to a trail's id.
    # 3. Extend trail type in this service, referencing trail's id field.
    # 4. trailAccess resolver in this service looks up trails using the Trail id field.
    # 5. __resolveReference in trail service kicks in to find the specified trail.
    trailAccess: [Trail!]!
  }

  # We want to add a new field to Trail, but because it
  # relates to lifts, we add it in here, the lift service.
  # Use the key directive so we can look up the Trail
  # from the Trail service, and add the new liftAccess field.
  extend type Trail @key(fields: "id"){
    id: ID! @external
    liftAccess: [Lift!]!
  }
    
  enum LiftStatus {
    OPEN
    HOLD
    CLOSED
  }

  type Query {
    allLifts(status: LiftStatus): [Lift!]!
    Lift(id: ID!): Lift!
    liftCount(status: LiftStatus): Int!
  }

  type Mutation {
    setLiftStatus(id: ID!, status: LiftStatus!): Lift!
  }
`;
const resolvers = {
  Query: {
    allLifts: (root, { status }) =>
      !status ? lifts : lifts.filter((lift) => lift.status === status),
    Lift: (root, { id }) => lifts.find((lift) => id === lift.id),
    liftCount: (root, { status }) =>
      !status
        ? lifts.length
        : lifts.filter((lift) => lift.status === status).length,
  },
  Mutation: {
    setLiftStatus: (root, { id, status }) => {
      let updatedLift = lifts.find((lift) => id === lift.id);
      updatedLift.status = status;
      return updatedLift;
    },
  },
  // Need a new resolver for the extended Trail entity.
  // Add a resolver for the new liftAccess field which will
  // return lifts by trail id.
  // This allows us to do a query like this:
  //
  // query AllTrails {
    //   allTrails {
    //     name
    //     liftAccess {
    //       name
    //       status
    //     }
    //   }
    // }
    //
    // to get a response like this:
    //
    // {
    //     "data": {
    //       "allTrails": [
    //         {
    //           "name": "Blue Bird",
    //           "liftAccess": [
    //             {
    //               "name": "Astra Express",
    //               "status": "OPEN"
    //             }
    //           ]
    //         }
    //         ...
    //       ]
    //     }
    //   }
  Trail: {
    liftAccess: trail =>
        lifts.filter(lift => lift.trails.includes(trail.id))
  },
  // This resolves trailAccess on a Lift. The Trail
  // service will be used to get the trails. 
  // In tha trail service we've added a __resolveReference
  // resolver so that when a service looks up a Trail
  // by its id, that __resolveReference will kick in
  // and find the matching trail.
  Lift: {
    trailAccess: lift =>
        lift.trails.map(id => ({ __typename: "Trail", id}))
  }
};

const server = new ApolloServer({
    schema: buildSubgraphSchema({
        typeDefs,
        resolvers
    })
});

server.listen(process.env.PORT).then(({ url }) => {
  console.log(`🚠 Snowtooth Lift Service running at ${url}`);
});
