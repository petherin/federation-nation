const { ApolloServer } = require("apollo-server");
const { ApolloGateway} =  require("@apollo/gateway");

// If we update our services, we have to stop and restart them.
// To avoid having to do this we can use managed federation
// in Apollo Studio. This means we don't have to provide
// a serviceList below and services can be updated
// without restarting them.
const gateway = new ApolloGateway({
    serviceList: [
        {name: "trails", url: "http://localhost:5001"},
        {name: "lifts", url: "http://localhost:5002"}
    ]
});

const start =  async() => {
    const server = new ApolloServer({
        gateway
    });

    server.listen(process.env.PORT).then(({ url }) => {
       console.log(`⛷️  The Snow Tooth Gateway is running at ${url}`); 
    });
}

start();