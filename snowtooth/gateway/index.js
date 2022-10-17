const { ApolloServer } = require("apollo-server");
const { ApolloGateway} =  require("@apollo/gateway");

const gateway = new ApolloGateway({
    serviceList: [
        {name: "trails", url: "http://localhost:5001"},
        {name: "lifts", url: "http://localhost:5002"}
    ]
});

const start =  async() => {
    const server = new ApolloServer({
        gateway,
        subscriptions: false
    });

    server.listen(process.env.PORT).then(({ url }) => {
       console.log(`The Snow Tooth Gateway is running at ${url}`); 
    });
}

start();