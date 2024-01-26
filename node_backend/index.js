// Imports the Socket.IO server module.
const { Server } = require("socket.io");

/* Imports the uuid library 
 ** rename v4 function to uuidv4
*/
const { v4: uuidv4 } = require('uuid');

/* Creates a new Socket.IO server instance
 ** CORS configuration allows all origins
*/
const io = new Server({ cors: { origin: "*" } });

/**
 * Class representing a group of users.
 * @class
 */
class Group {
  /**
   * Create a group with a unique ID.
   * @constructor
   */
  leader;
  ids = [];
  constructor() {
    /**
     * The unique ID of the group.
     * @member {string}
     */
    this.name = uuidv4(); // assign group an id
  }
}

/**
 * Array containing groups of users.
 * @type {Array<Group>}
 */
var groups = [new Group];

/**
 * Maximum number of users per group.
 * @type {number}
 */
var maxUsers = 5;

/**
 * Assign a user to an existing group or create a new group.
 * @function
 * @returns {Group} The assigned or newly created group.
 */
function assignGroup() {
  console.log(groups);
  for (let i = 0; i < groups.length; i++) {
    if (groups[i].ids.length < maxUsers) {
      return groups[i];
    }
  }
  var group = new Group();
  groups.push(group);
  return group;
}

/**
 * Handle user connections and disconnections.
 * @function
 * @param {string} id - The user's ID.
 * @param {boolean} userState - The state of the user (connecting or disconnecting).
 * @param {Group} g - The user's group.
 * @returns {Group} The updated group.
 */
function connectionFunc(id, userState, g) {
  if (userState === true) { // user connecting
    var group = assignGroup();
    group.ids.push(id);
    if (group.leader === undefined) {
      group.leader = id;
    }
    return group;
  } else { // player disconnecting
    g.ids.splice(g.ids.indexOf(id), 1);
    if (id === g.leader) {
      g.leader = g.ids[0];
    }
  }
}

/**
 * Handle socket connections.
 * @event
 * @param {Socket} socket - The connected socket.
 */
io.on("connection", (socket) => {
  /**
   * The unique ID of the connected socket.
   * @type {string}
   */
  const id = uuidv4();
  socket.emit("id", id);
  var g = connectionFunc(id, true);
  socket.join(g.name);
  console.log("a player joined with id: " + id + " and added to group: " + g.name);

  /**
   * Listen for "update" events and broadcast updates to all users in the group.
   * @event
   * @param {any} data - The update data.
   */
  socket.on("update", (data) => {
    console.log("fired for:" +id);
    data.id = id;
    socket.to(g.name).emit("stateUpdate", data);
  });

  /**
   * Listen for "event_name_here" events and start the event for the group leader.
   * @event
   * @param {string} id - The sender's ID.
   */
  socket.on("event_name_here", (id) => {
    if (id === g.leader) {
      io.to(g.name).emit("event_nameStart", "");
    }
  });

  /**
   * Listen for "disconnect" events and handle user disconnections.
   * @event
   */
  socket.on("disconnect", () => {
    connectionFunc(id, false, g);
    io.emit("disconnection", id);
  });
});

/**
 * Start the Socket.IO server on port 3000.
 */
io.listen(3000);
