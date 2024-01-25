---
layout: base
title: Socket.io Multiplayer Game
description: Using socket.io for multiplayer game
type: devops
courses: { csse: {week: 18} }
image: /images/platformer/backgrounds/hills.png
---

<style>
    #gameBegin, #controls, #gameOver, #multiplayer, #settings, #buttonings {
        position: relative;
        z-index: 2; /*Ensure the controls are on top*/
    }
    .sidenav {
      position: fixed;
      height: 100%; /* 100% Full-height */
      width: 0px; /* 0 width - change this with JavaScript */
      z-index: 3; /* Stay on top */
      top: 0; /* Stay at the top */
      left: 0;
      overflow-x: hidden; /* Disable horizontal scroll */
      padding-top: 60px; /* Place content 60px from the top */
      transition: 0.5s; /* 0.5 second transition effect to slide in the sidenav */
      background-color: black; 
    }
    #chat-box {
      position: relative;
      z-index: 2;
      height: 300px;
      overflow-y: scroll;
      border: 3px solid #ccc;
      border-style: double;
      border-width: thick;
      padding: 10px;
    }
    #message-input {
      position: relative;
      z-index: 2;
      width: 70%;
      padding: 8px;
    }
    #send-button {
      position: relative;
      z-index: 2;
      padding: 8px;
      cursor: pointer;
    }
</style>

<div id="mySidebar" class="sidenav">
  <a href="javascript:void(0)" id="toggleSettingsBar1" class="closebtn">&times;</a>
</div>

<!-- Prepare DOM elements -->
<!-- Wrap both the canvas and controls in a container div -->
<div id="canvasContainer">
    <div id="gameBegin" hidden>
        <button id="startGame">Start Game</button>
    </div>
    <div id="controls"> <!-- Controls -->
        <!-- Background controls -->
        <button id="toggleCanvasEffect">Invert</button>
    </div>
    <div id="Multiplayer">
        <button id="multiplayer">Multiplayer</button>
    </div>
    <div id="gameOver" hidden>
        <button id="restartGame">Restart</button>
    </div>
    <div id="settings"> <!-- Controls -->
        <!-- Background controls -->
        <button id="toggleSettingsBar">Settings</button>
        <button id="leaderboard">leaderboard</button>
    </div>
    <div id ="buttonings">
      <button id="toggleChatElements">Toggle Chat Elements</button>
    </div>
</div>

<!--Chat Box Button command-->
<div id="chat-box-container">
  <div id="chat-box"></div>
</div>
<input type="text" id="message-input" placeholder="Type your message...">
<button id="send-button">Send</button>


<script type="module">
    // Imports
    import GameEnv from '{{site.baseurl}}/assets/js/multiplayer/GameEnv.js';
    import GameLevel from '{{site.baseurl}}/assets/js/multiplayer/GameLevel.js';
    import GameControl from '{{site.baseurl}}/assets/js/multiplayer/GameControl.js';
    import Controller from '{{site.baseurl}}/assets/js/multiplayer/Controller.js';

    /*  ==========================================
     *  ======= Data Definitions =================
     *  ==========================================
    */

    // Define assets for the game
    var assets = {
      obstacles: {
        tube: { src: "/images/platformer/obstacles/tube.png" },
      },
      platforms: {
        grass: { src: "/images/platformer/platforms/grass.png" },
        alien: { src: "/images/platformer/platforms/alien.png" }
      },
      backgrounds: {
        start: { src: "/images/platformer/backgrounds/home.png" },
        hills: { src: "/images/platformer/backgrounds/hills.png" },
        planet: { src: "/images/platformer/backgrounds/planet.jpg" },
        castles: { src: "/images/platformer/backgrounds/castles.png" },
        end: { src: "/images/platformer/backgrounds/game_over.png" }
      },
      players: {
        mario: {
          src: "/images/platformer/sprites/mario.png",
          width: 256,
          height: 256,
          w: { row: 10, frames: 15 },
          wa: { row: 11, frames: 15 },
          wd: { row: 10, frames: 15 },
          a: { row: 3, frames: 7, idleFrame: { column: 7, frames: 0 } },
          s: {  },
          d: { row: 2, frames: 7, idleFrame: { column: 7, frames: 0 } }
        },
        monkey: {
          src: "/images/platformer/sprites/monkey.png",
          width: 40,
          height: 40,
          w: { row: 9, frames: 15 },
          wa: { row: 9, frames: 15 },
          wd: { row: 9, frames: 15 },
          a: { row: 1, frames: 15, idleFrame: { column: 7, frames: 0 } },
          s: { row: 12, frames: 15 },
          d: { row: 0, frames: 15, idleFrame: { column: 7, frames: 0 } }
        }
      }
    };

    // add File to assets, ensure valid site.baseurl
    Object.keys(assets).forEach(category => {
      Object.keys(assets[category]).forEach(assetName => {
        assets[category][assetName]['file'] = "{{site.baseurl}}" + assets[category][assetName].src;
      });
    });

    /*  ==========================================
     *  ===== Game Level Call Backs ==============
     *  ==========================================
    */

    // Level completion tester
    function testerCallBack() {
        // console.log(GameEnv.player?.x)
        if (GameEnv.player?.x > GameEnv.innerWidth) {
            return true;
        } else {
            return false;
        }
    }

    // Helper function for button click
    function waitForButton(buttonName) {
      // resolve the button click
      return new Promise((resolve) => {
          const waitButton = document.getElementById(buttonName);
          const waitButtonListener = () => {
              resolve(true);
          };
          waitButton.addEventListener('click', waitButtonListener);
      });
    }

    // Start button callback
    async function startGameCallback() {
      const id = document.getElementById("gameBegin");
      id.hidden = false;
      
      // Use waitForRestart to wait for the restart button click
      await waitForButton('startGame');
      id.hidden = true;
      
      return true;
    }

    // Home screen exits on Game Begin button
    function homeScreenCallback() {
      // gameBegin hidden means game has started
      const id = document.getElementById("gameBegin");
      return id.hidden;
    }

    // Game Over callback
    async function gameOverCallBack() {
      const id = document.getElementById("gameOver");
      id.hidden = false;
      
      // Use waitForRestart to wait for the restart button click
      await waitForButton('restartGame');
      id.hidden = true;
      
      // Change currentLevel to start/restart value of null
      GameEnv.currentLevel = null;

      return true;
    }

    /*  ==========================================
     *  ========== Game Level setup ==============
     *  ==========================================
     * Start/Homme sequence
     * a.) the start level awaits for button selection
     * b.) the start level automatically cycles to home level
     * c.) the home advances to 1st game level when button selection is made
    */
    // Start/Home screens
    new GameLevel( {tag: "start", callback: startGameCallback } );
    new GameLevel( {tag: "home", background: assets.backgrounds.start, callback: homeScreenCallback } );
    // Game screens
    new GameLevel( {tag: "hills", background: assets.backgrounds.hills, platform: assets.platforms.grass, player: assets.players.mario, tube: assets.obstacles.tube, callback: testerCallBack } );
    new GameLevel( {tag: "alien", background: assets.backgrounds.planet, platform: assets.platforms.alien, player: assets.players.monkey, callback: testerCallBack } );
    // Game Over screen
    new GameLevel( {tag: "end", background: assets.backgrounds.end, callback: gameOverCallBack } );

    /*  ==========================================
     *  ========== Game Control ==================
     *  ==========================================
    */

    // create listeners
    toggleCanvasEffect.addEventListener('click', GameEnv.toggleInvert);
    window.addEventListener('resize', GameEnv.resize);

    // start game
    GameControl.gameLoop();

    var myController = new Controller();
    myController.initialize();
    var table = myController.levelTable;
    document.getElementById("mySidebar").append(table);
    var speedDiv = myController.speedDiv;
    document.getElementById("mySidebar").append(speedDiv);
    var gravityDiv = myController.gravityDiv;
    document.getElementById("mySidebar").append(gravityDiv);

    var toggle = false;
    function toggleWidth(){
        toggle = !toggle;
        document.getElementById("mySidebar").style.width = toggle?"250px":"0px";
    }
    document.getElementById("toggleSettingsBar").addEventListener("click",toggleWidth);
    document.getElementById("toggleSettingsBar1").addEventListener("click",toggleWidth);

    document.getElementById("leaderboard").addEventListener("click",()=>{
      GameEnv.socket.emit("addScore",{name:prompt("Please enter your name", "Harry Potter"),score:Number(prompt("score","2000"))});
    })

    GameEnv.socket.emit("name",prompt("Please enter your name", "Harry Potter")); //give server a name
</script>

<!-- Chat system functions -->

<script type= "module">
  import GameEnv from '{{site.baseurl}}/assets/js/multiplayer/GameEnv.js';

  const prohibitedWords = ['westview', 'pee', 'poo', 'ian', 'matthew', 'trystan', 'gavin', 'multiplayer', 'multi', 'leaderboard', 'enemies', 'gamelevels', 'interactions', 'sass', 'sassy', 'sas', '911', 'die', 'luigi', 'peach', 'bowser', 'mario', 'mr.mortensen', 'mr. mortensen', 'mortensen', 'lopez', 'mr.lopez', 'mr. lopez','mister mortensen', 'mister lopez'];

  function updateMessage(id,message,name) {
    var messageInput = document.getElementById('message-input');
    if(!message){message = messageInput.value};
    var chatBox = document.getElementById('chat-box');

    prohibitedWords.forEach(word => {
      const regex = new RegExp('\\b' + word + '\\b', 'gi');
      message = message.replace(regex, 'I Love CSSE! '.repeat(word.length));
    });

    if (message.trim() !== '') {
      if(id == GameEnv.id){return} //if you from server
      else if(!id){ //if you from client
      GameEnv.socket.emit("message",message);
      // Display the message in the chat box
      chatBox.innerHTML += '<p><strong>You:</strong> ' + message + '</p>';
      // Clear the input field
      messageInput.value = '';
      }
      else{ //if different person
        chatBox.innerHTML += '<p><strong>'+name+':</strong> ' + message + '</p>';
      }
    }
  }

  document.getElementById('send-button').addEventListener('click', ()=>{updateMessage(false,false)});
  GameEnv.socket.on("updateMessage",(data)=>{updateMessage(data.id,data.message,data.name?data.name:data.id)});//from server

  function toggleChatElements() {
    var chatBox = document.getElementById('chat-box');
    var messageInput = document.getElementById('message-input');
    var sendButton = document.getElementById('send-button');

    // Toggle visibility
    chatBox.style.display = (chatBox.style.display === 'none' || chatBox.style.display === '') ? 'block' : 'none';
    messageInput.style.display = (messageInput.style.display === 'none' || messageInput.style.display === '') ? 'block' : 'none';
    sendButton.style.display = (sendButton.style.display === 'none' || sendButton.style.display === '') ? 'block' : 'none';
  }

  // Attach event listener for the new toggle button
  document.getElementById('toggleChatElements').addEventListener('click', toggleChatElements);

</script>