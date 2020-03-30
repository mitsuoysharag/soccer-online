var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');

var app = express();
var server = http.Server(app);
var io = socketIO(server);

app.use('/static', express.static(__dirname + '/static'));

// Routing
app.get('/', function (request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});

// Starts the server.
const PORT = process.env.PORT || 3000
server.listen(PORT, function () {
  console.log('Starting server');
});

// Add the WebSocket handlers
let players = {};
let player_velocity = 4;
let ball_velocity = 8;
let width = 1100;
let height = 700;

class Player {
  constructor(pos, dir, vel, lim, ball) {
    this.pos = pos
    this.dir = dir
    this.vel = vel
    this.lim = lim
    this.ball = ball
  }
  update() {
    //Kick
    var disX = this.pos.x - this.ball.pos.x;
    var disY = this.pos.y - this.ball.pos.y;
    var dis = Math.sqrt(disX * disX + disY * disY);
    if (dis < 40) {
      disX /= dis
      disY /= dis
      this.ball.dir.x = -disX
      this.ball.dir.y = -disY
    } else {
      //Movement
      let newPosX = this.pos.x + this.dir.x * this.vel
      let newPosY = this.pos.y + this.dir.y * this.vel
      let offset = 20

      if (newPosX > this.lim.width - offset || newPosX < offset) {
        this.dir.x = 0
      }
      if (newPosY > this.lim.height - offset || newPosY < offset) {
        this.dir.y = 0
      }

      this.pos.x += this.dir.x * this.vel
      this.pos.y += this.dir.y * this.vel
    }
  }
}

class Ball {
  constructor(pos, dir, vel, lim) {
    this.pos = pos
    this.dir = dir
    this.vel = vel
    this.lim = lim
  }
  update() {
    let newPosX = this.pos.x + this.dir.x * this.vel
    let newPosY = this.pos.y + this.dir.y * this.vel
    let offset = 10

    if (newPosX > this.lim.width - offset || newPosX < offset) {
      this.dir.x *= -1
    }
    if (newPosY > this.lim.height - offset || newPosY < offset) {
      this.dir.y *= -1
    }

    this.pos.x += this.dir.x * this.vel
    this.pos.y += this.dir.y * this.vel
  }
}

let ball = new Ball({
  x: width / 2,
  y: height / 2
}, {
  x: 0,
  y: 0
}, ball_velocity, {
  width,
  height
})

io.on('connection', function (socket) {
  socket.on('new player', function () {
    players[socket.id] = new Player({
      x: width / 2 - 100,
      y: height / 2
    }, {
      x: 0,
      y: 0
    }, player_velocity, {
      width,
      height
    },
      ball)
  });
  socket.on('movement', function (dir) {
    var player = players[socket.id] || {};
    player.dir = dir
  });
  socket.on('disconnect', function () {
    delete players[socket.id]
  });
  socket.on('reset', function () {
    ball.pos = {
      x: width / 2,
      y: height / 2
    }
    ball.dir = {
      x: 0,
      y: 0
    }
  });
});

setInterval(function () {
  ball.update()
  Object.entries(players).forEach(([id, player]) => {
    player.update()
  });
  io.sockets.emit('state', { players, ball });
}, 1000 / 60);