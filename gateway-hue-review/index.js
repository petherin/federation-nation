const { ApolloServer } = require("apollo-server");
const { ApolloGateway} =  require("@apollo/gateway");

const gateway = new ApolloGateway({
    serviceList: [
        {name: "users", url: "http://localhost:4001"},
        {name: "colors", url: "http://localhost:4002"}
    ]
});

const start =  async() => {
    const server = new ApolloServer({
        gateway,
        subscriptions: false
    });

    server.listen(process.env.PORT).then(({ url }) => {
       console.log(`The Hue Review Gateway running at ${url}`); 
    });
}

start();