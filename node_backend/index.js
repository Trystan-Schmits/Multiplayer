const http = require('http');
const server = http.createServer();
const io = require('socket.io')(http,{cors: {origin: "*"}});
const PORT = 3000;

const { v4: uuidv4 } = require('uuid');

var leaderId;
var idList = [];

io.on('connection',(socket) => {

  const id = uuidv4();
  socket.emit("id",id);
  console.log("a user connected, given id: "+id);

  if(!leaderId){
    leaderId = id
    console.log("leader given id: "+id);
  };
  idList.push(id);

  socket.on('message',(message)=>{
      io.emit('message',message);
  })

  socket.on("update", (data) => {
      io.emit("stateUpdate", data);
  })
  
  socket.on("disconnect", () => {
      idList.splice(idList.indexOf(id),1);
      if(id == leaderId){
          leaderId = idList[0];
          console.log("leader disconnected, leader given id"+idList[0]);
      }
      console.log("a user disconnected, with id: "+id)
      io.emit("disconnection", id);
  })
});

server.listen(PORT,()=>{
  console.log("listening on port: "+String(PORT));
});