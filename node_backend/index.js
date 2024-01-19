const { Server } = require("socket.io");
const { v4: uuidv4 } = require('uuid');

const io = new Server({ cors: { origin: "*" } });

class Group{
  leader;
  ids = [];
  constructor(){
    this.name = uuidv4();// assign group an id
  };
}

var groups = [new Group];
var maxUsers = 5; //maximum users per group

function assignGroup(){
  console.log(groups)
  for(let i = 0; i<groups.length;i++) {
    if (groups[i].ids.length < maxUsers){
      return groups[i];
    }
  }
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
    g.ids.splice(g.ids.indexOf(id),1);
    if(id == g.leader){
      g.leader = g.ids[0];
    }
  }
}

io.on("connection", (socket) => {
  const id = uuidv4();
  socket.emit("id", id);
  var g = leaderFunc(id,true);
  socket.join(g.name);
  console.log("a player joined with id: "+id+" and added to group: "+g.name);

  socket.on("update", (data) => {
      io.to(g.name).emit("stateUpdate", data); //send update to all in group
  })

  socket.on("disconnect", () => {
    leaderFunc(id,false,g);
    io.emit("disconnection", id);
  })
});

io.listen(3000);