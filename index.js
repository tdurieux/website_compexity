const express = require('express')
const WebSocket = require('ws');
const getTraceRoute = require('./get_traceroute').getTraceRoute

const app = express();
const server = require('http').Server(app);
const port = 3300

const wssServer = new WebSocket.Server({ server });
wssServer.on('connection', function connection(ws) {
    ws.isAlive = true;
    ws.on('pong', () => ws.isAlive = true);
    ws.on('message', async function(message) {
        getTraceRoute({
            url: message,
            onTrace: function (data) {
                ws.send(JSON.stringify({type: "trace", data: data}))
            },
            onCoverage: function (data) {
                ws.send(JSON.stringify({type: "coverage", data: data}))
            },
            onScreenshot: function (data) {
                ws.send(JSON.stringify({type: "screenshot", data: data}))
            },
            onRequestEnd: function (data) {
                ws.send(JSON.stringify({type: "requestEnd", data: data}))
            },
            onRequest: function (data) {
                ws.send(JSON.stringify({type: "request", data: data}))
            },
            onProfile: function (data) {
                ws.send(JSON.stringify({type: "profile", data: data}))
            }
        })
    });
});
wssServer.broadcast = function broadcast(data) {
    wssServer.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data, error => {
                if (error) {
                    console.error(error);
                }
            });
        }
    });
};
app.use(express.static('public'))

app.get('/', (req, res) => res.send('Hello World!'))

server.listen(port, () => console.log(`Example app listening on port ${port}!`))