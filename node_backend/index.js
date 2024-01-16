const { Server } = require("socket.io");
const { v4: uuidv4 } = require('uuid');

const io = new Server({ cors: { origin: "*" } });

var ids = [];
var leader;

function leaderFunc(id,userState){
  if(userState == true){//user connecting
    ids.push(id);
    if(leader==undefined){
      leader = id;
    }
  } 
  else { //player disconnecting
    ids.slice(ids.findIndex(id),1);
    if(id == leader){
      leader = ids[0];
    }
  }
}

io.on("connection", (socket) => {
  const id = uuidv4();
  socket.emit("id", id);
  leaderFunc(id,true);

  socket.on("update", (data) => {
    console.log(data)
    io.emit("stateUpdate", data)
  })

  socket.on("disconnect", () => {
    leaderFunc(id,false);
    io.emit("disconnection", id)
  })
});

io.listen(3000);