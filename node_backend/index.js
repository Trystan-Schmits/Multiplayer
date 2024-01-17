const { Server } = require("socket.io");
const { v4: uuidv4 } = require('uuid');

const io = new Server({ cors: { origin: "*" } });

var groups = [];
var maxUsers = 2; //maximum users per group

class Group{
  leader;
  ids = [];
  constructor(){};
}

function assignGroup(){
  let i = 0;
  do {
    if (groups[i].ids.length < maxUsers){
      return groups[i];
    }
  }
  while (i<groups.length);
  var group = new Group;
  groups.push(group);
  return group;
}

function leaderFunc(id,userState,g){
  if(userState == true){//user connecting
    var group = assignGroup();
    group.ids.push(id);
    if(group.leader==undefined){
      group.leader = id;
    }
    return group;
  } 
  else { //player disconnecting
    g.ids.slice(g.ids.findIndex(id),1);
    if(id == g.leader){
      g.leader = g.ids[0];
    }
  }
}

io.on("connection", (socket) => {
  const id = uuidv4();
  socket.emit("id", id);
  var g = leaderFunc(id,true);

  socket.on("group",()=>{
    socket.emit(g);
  })

  socket.on("update", (data) => {
      io.emit("stateUpdate", data);
  })

  socket.on("disconnect", () => {
    leaderFunc(id,false,g);
    io.emit("disconnection", id);
  })
});

io.listen(3000);