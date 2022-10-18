const { ApolloServer } = require("apollo-server");
const { ApolloGateway, RemoteGraphQLDataSource } = require("@apollo/gateway");
const fetchUserEmail = require("./fetchUserEmail");

// AuthenticatedDataSource overrides RemoteGraphQLDataSource's willSendRequest to set an authorization header
// if we have an authorization value on the context. Guessing context is a built-in variable providing
// access to GraphQL context.
//
//This lets us pass an auth token from the gateway to the subgraph services.
class AuthenticatedDataSource extends RemoteGraphQLDataSource{
    async willSendRequest({request, context}) {
        if(context.authorization){
            // If we have authorization on the context then get the current user's email, passing the auth token.
            // If we get an email, set the user-email and authorization headers.
            // This makes sure the color service captures the email from the gateway 
            // so that when we run addColor mutation, 
            // the color service can add this into the record.
            const email = await fetchUserEmail(
                context.authorization
                );
            if (email){
                request.http.headers.set("user-email", email);
                request.http.headers.set(
                    "authorization",
                    context.authorization
                );
            }
        
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
        // When server starts, set authorization on the context to the authorization header.
        // Does this set it now, or just sets an empty authorization value which is set later  
        // by willSendRequest?
        context: ({req}) => ({
            authorization: req.headers.authorization
        })
    });

    server.listen(process.env.PORT).then(({ url }) => {
       console.log(`The Hue Review Gateway running at ${url}`); 
    });
}

start();