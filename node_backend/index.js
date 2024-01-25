const { Server } = require("socket.io");
const { v4: uuidv4 } = require('uuid');

const io = new Server({ cors: { origin: "*" } });

var globalLeaderboard = []; //{name,score}

class Group{
  leader;
  ids = [];
  leaderboard = [];
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

function connectionFunc(id,userState,g){
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
  var g = connectionFunc(id,true);
  socket.join(g.name);
  var name;//used as a display name if wanted

  console.log("a player joined with id: "+id+" and added to group: "+g.name);

  socket.on("update", (data) => {
      io.to(g.name).emit("stateUpdate", data); //send update to all in group
  })

  socket.on("name",(n)=>{ //prompt client to create a name
    name = n;
  })

  socket.on("addScore", (data)=>{ //setup for multiplayer events
    data.name = data.name?data.name:id;
    if(data.score){
      var score = {name:data.name,score:data.score};
      globalLeaderboard.push(score);
      g.leaderboard.push(score);
      io.emit("updateLeaderboard",globalLeaderboard);
      io.to(g.name).emit("updateRoomLeaderboard",g.leaderboard);
    }
  });

  socket.on("message",(d)=>{ //chat
      io.to(g.name).emit("updateMessage",{message:d,id:id,name:name});
  })

  socket.on("leaderboardUpdateRequest",()=>{
    socket.emit("updateLeaderboard",globalLeaderboard);
    socket.emit("updateRoomLeaderboard",g.leaderboard);
  });

  socket.on("disconnect", () => {
    connectionFunc(id,false,g);
    io.emit("disconnection", id);
  })
});

io.listen(3000);