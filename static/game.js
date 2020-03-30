var socket = io();

var dir = {
  x: 0,
  y: 0
}
document.addEventListener('keydown', function (event) {
  switch (event.keyCode) {
    case 65: // A
      dir.x = -1;
      break;
    case 87: // W
      dir.y = -1;
      break;
    case 68: // D
      dir.x = 1;
      break;
    case 83: // S
      dir.y = 1;
      break;
  }
});
document.addEventListener('keyup', function (event) {
  switch (event.keyCode) {
    case 65: // A
      dir.x = 0;
      break;
    case 87: // W
      dir.y = 0;
      break;
    case 68: // D
      dir.x = 0;
      break;
    case 83: // S
      dir.y = 0;
      break;
  }
});

function moveX(x) {
  dir.x = x
}
function moveY(y) {
  dir.y = y
}

socket.emit('new player');
setInterval(function () {
  socket.emit('movement', dir);
}, 1000 / 60);

//Canvas
var canvas = document.getElementById('canvas');
canvas.width = 1100;
canvas.height = 700;
var context = canvas.getContext('2d');

socket.on('state', ({ players, ball }) => {
  context.clearRect(0, 0, 1100, 700);
  for (var id in players) {
    var player = players[id];
    context.fillStyle = player.color;
    context.beginPath();
    context.arc(player.pos.x, player.pos.y, 20, 0, 2 * Math.PI);
    context.fill();
  }
  context.fillStyle = 'white';
  context.beginPath();
  context.arc(ball.pos.x, ball.pos.y, 12, 0, 2 * Math.PI);
  context.fill();
});

function reset() {
  socket.emit('reset');
}