# Example NodeJS Connector
An example HTTP server for listening to [PagerTree outgoing webhooks](https://pagertree.com/docs/integration-guides/outgoing-webhook).

The server listens for webhooks and then does custom logic. It comes with a fly.toml to be deployed on [fly.io](https://fly.io) but can be run anywhere using the Dockerfile.

## Running the Server
`DEBUG=example-client-connector:* npm start` then open your browswer to http://localhost:3000

The custom endpoints and logic can be found in [./routes/freshservice.js](./routes/freshservice.js), but this is only an example. It is up to you to write whatever custom logic you need for your app.