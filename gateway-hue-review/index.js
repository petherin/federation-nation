const { ApolloServer } = require("apollo-server");
const { ApolloGateway, RemoteGraphQLDataSource } = require("@apollo/gateway");

// AuthenticatedDataSource overrides RemoteGraphQLDataSource's willSendRequest to set an authorization header
// if we have an authorization value on the context. Guessing context is a built-in variable providing
// access to GraphQL context.
// This lets us pass an auth token to subgraphs via the context.
class AuthenticatedDataSource extends RemoteGraphQLDataSource{
    async willSendRequest({request, context}) {
        if(context.authorization){
            request.http.headers.set(
                "authorization",
                context.authorization
            );
        }
    }
}

const gateway = new ApolloGateway({
    serviceList: [
        {name: "users", url: "http://localhost:4001"},
        {name: "colors", url: "http://localhost:4002"}
    ],
    // Add a buildService function to the gateway which will return AuthenticatedDataSource
    buildService({url}) {
        return new AuthenticatedDataSource({url});
    }
});

const start =  async() => {
    const server = new ApolloServer({
        gateway,
        // When server starts, set authorization on the context to the authorization header
        context: ({req}) => ({
            authorization: req.headers.authorization
        })
    });

    server.listen(process.env.PORT).then(({ url }) => {
       console.log(`The Hue Review Gateway running at ${url}`); 
    });
}

start();