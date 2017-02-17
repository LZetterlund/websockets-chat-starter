const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

// read the client html file into memory
// __dirname in node is the current directory
// (in this case the same folder as the server js file)
const index = fs.readFileSync(`${__dirname}/../client/client.html`);

const onRequest = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

const app = http.createServer(onRequest).listen(port);

console.log(`Listening on 127.0.0.1: ${port}`);

// pass in the http server into socketio and grab the webscoket server as io
const io = socketio(app);

// object to hold all of our connected users
const users = {};

const onJoined = (sock) => {
  const socket = sock;

  socket.on('join', (data) => {
        // current functionality doesn't make use of name, might as well just increment a number
    users[Object.keys(users).length] = data.name;
        // message back to new user
    const joinMsg = {
      name: 'server',
      msg: `There are ${Object.keys(users).length} users online`,
    };

    socket.name = data.name;
    socket.emit('msg', joinMsg);

    socket.join('room1');

        // announcemnet to everyone in the room
    const response = {
      name: 'server',
      msg: `${data.name} has joined the room.`,
    };
    socket.broadcast.to('room1').emit('msg', response);

    console.log(`${data.name} joined`);
        // success message back to new user
    socket.emit('msg', { name: 'server', msg: 'You joined the room' });
  });
};

const onMsg = (sock) => {
  const socket = sock;

  socket.on('msgToServer', (data) => {
        // functionality for 20 sided dice roll
    if (data.msg === '/roll') {
      const rand = Math.ceil(Math.random() * 20);
      io.sockets.in('room1').emit('msg', { name: socket.name, msg: data.msg, roll: rand });
    } else {
      io.sockets.in('room1').emit('msg', { name: socket.name, msg: data.msg });
    }
  });
};

const onDisconnect = (sock) => {
  const socket = sock;

  socket.on('disconnect', () => {
        // grabs index of name to be removed and splice it out of array
        // function findName(user) {
        //    return user == data.name
        // }
        // const index = users.find(findName);
        // if (index > -1) {
        //    users.splice(index, 1);
        // }

        // simpler way since we're not using the names in the array
        // users.splice(users.length, 1);

    console.log(`${socket.name} left`);

        // io.sockets.in('room1').emit('disconnect', { name: socket.name });

    const response = {
      name: 'server',
      msg: `${socket.name} has left the room.`,
    };

    socket.broadcast.to('room1').emit('msg', response);
  });
};

io.sockets.on('connection', (socket) => {
  console.log('started');

  onJoined(socket);
  onMsg(socket);
  onDisconnect(socket);
});

console.log('Websocket server started');
