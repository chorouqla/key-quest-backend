// KEY QUEST PLATFORMER


// ===== CANVAS SETUP =====
const canvas = document.getElementById('gameCanvas');//the drawing board where everything appears
const c = canvas.getContext('2d'); // like pen to draw on the canvas

//canvas dimension
canvas.width = 1376
canvas.height = 768

// GAME CONSTANTS
const gravity = 0.5   // How fast player accelerates downward
const blockSize = 16  // Each block in the map is 16x16 pixels
const mapWidth = 86

//GAME STATE VARIABLES
let gameState = "playing"; //  "playing", "win", "gameover"
let hasKey = false
let gemsCollected = 0
let totalGems = 0;
let lives = 3
let timeLeft = 30
let gameWon = false


// COLLISIONMAP PROCESSING
// collisions is loaded from external file (collisions1.js)
const collisionsMap = [] // TO a 2d array

// Convert 1D array to 2D by slicing every 'mapWidth' elements
for (let i = 0; i < collisions.length; i += mapWidth) {
    collisionsMap.push(collisions.slice(i, i + mapWidth))
}

// Store a copy of the original map so we can reset the level later
const originalCollisionsMap = JSON.parse(JSON.stringify(collisionsMap))


// ITEM POSITION DETECTION
let gemPositions = []  // Array to store all gem positions
let keyPosition = null
let doorPosition = null

// Loop through every cell in our 2D map
for (let row = 0; row < collisionsMap.length; row++) {
    for (let col = 0; col < collisionsMap[0].length; col++) {

        const block = collisionsMap[row][col] //get the value at this cell

        if (block === 5) {

            gemPositions.push({ row, col }) //store gem position
            totalGems++;

        }

        if (block === 6 && !keyPosition) {
            keyPosition = { row, col }
        }

        if (block === 2 && !doorPosition) {
            doorPosition = { row, col }
        }
    }
}

// A Sprite is any image that can be drawn on screen
// This class handles loading and drawing images
class Sprite { // used to represent any image that can be drawn on the screen
    //it handles loading the image storing its position drawing it on the canvas

    constructor({ position, imageSrc, width, height }) {
        this.position = position //(x,y) cordinates
        this.width = width
        this.height = height
        this.image = new Image() //create a new image object
        this.image.src = imageSrc //set the image source file
    }

    // Draw the sprite on the canvas at its position
    draw() {
        if (!this.image) return // dont draw if image isnt loaded
        c.drawImage(
            this.image,
            this.position.x,
            this.position.y,
            this.width,
            this.height)
    }
}

// player class: This includes movement, collisions, and drawing
class Player {
    constructor({ x, y }) {
        this.position = { x, y }
        this.velocity = { x: 0, y: 0 } //speed in x and y directions

        //size
        this.width = 51
        this.height = 56

        //state tracking
        this.onGround = false

        //image
        this.image = new Image()
        this.image.src = "./assets/images/player1.png"
    }

    draw() {
        if (this.image) {
            c.drawImage(
                this.image,
                this.position.x,
                this.position.y,
                this.width,
                this.height
            );

            // Fallback if image fails to load
        } else {
            c.fillStyle = "red"
            c.fillRect(this.position.x, this.position.y, this.width, this.height)
        }
    }

    update() {
        // Apply gravity
        this.velocity.y += gravity
        this.onGround = false  // Assume player is in air until we check

        // Move horizontally first then check collisions
        this.position.x += this.velocity.x
        this.checkCollisions('x')

        // Move vertically then check collisions
        this.position.y += this.velocity.y
        this.checkCollisions('y')

        //Keep player withing map boundaries
        if (this.position.x < 0) this.position.x = 0
        if (this.position.x + this.width > collisionsMap[0].length * blockSize) {
            this.position.x = collisionsMap[0].length * blockSize - this.width
        }

        //draw in new position
        this.draw()
    }

    // Check if player is colliding with any blocks
    checkCollisions(axis) {
        // Loop through every block in the map
        for (let row = 0; row < collisionsMap.length; row++) {
            for (let col = 0; col < collisionsMap[0].length; col++) {
                const block = collisionsMap[row][col]
                if (block === 0) continue  // Skip empty blocks

                // Calculate block position in pixels
                const blockX = col * blockSize;
                const blockY = row * blockSize;

                // Check if player rectangle overlaps with block rectangle
                // This is called Axis-Aligned Bounding Box (AABB) collision detection
                if (this.position.x < blockX + blockSize &&
                    this.position.x + this.width > blockX &&
                    this.position.y < blockY + blockSize &&
                    this.position.y + this.height > blockY) {

                    // Collision detected! Handle based on block type
                    this.handleBlockCollision(block, blockX, blockY, axis, row, col
                        // If we collected an item, stop checking more collisions this frame
                    )
                    if (block === 5 || block === 6) {
                        return;
                    }
                }
            }
        }
    }


    // Handle different types of block collisions
    handleBlockCollision(block, blockX, blockY, axis, row, col) {
        switch (block) {
            case 1: // Floor
                if (axis === 'y') {
                    if (this.velocity.y > 0) { // Falling down
                        this.position.y = blockY - this.height //place on top
                        this.velocity.y = 0                     //stop falling
                        this.onGround = true                   //now on ground
                    } else if (this.velocity.y < 0) { // Jumping up (hitting ceiling)
                        this.position.y = blockY + blockSize   // Push down
                        this.velocity.y = 0                    // Stop upward motio
                    }
                } else if (axis === 'x') {
                    // Horizontal collision (hit wall while moving)
                    if (this.velocity.x > 0) { // moving right
                        this.position.x = blockX - this.width; //stop at left edge
                    } else if (this.velocity.x < 0) {          //mooving left
                        this.position.x = blockX + blockSize;  //stop at right edge
                    }
                }
                break;

            case 3: // Safe platform (can jump through from below)
                if (axis === 'y' && this.velocity.y > 0) {
                    // Only cland if falling from above
                    this.position.y = blockY - this.height
                    this.velocity.y = 0
                    this.onGround = true
                }
                break;

            case 4: // holes - instant death
                if (axis === 'y' && this.velocity.y > 0)
                    this.die()
                break;



            case 5://gems
                console.log("Gem collected!");
                //remove the gem block
                collisionsMap[row][col] = 0
                gemsCollected++
                updateUI() //update the display
                break

            case 6: // Key
                if (!hasKey) {
                    console.log("Key collected!")
                    hasKey = true
                    // Remove the key block
                    collisionsMap[row][col] = 0;
                    updateUI()
                }

                break
        }
    }

    // Handle player death
    die() {
        console.log("Player died!")
        lives--
        updateUI()

        if (lives <= 0) {
            // Game over - rno lives left
            gameState = "gameover"
            // SHOW GAME OVER OVERLAY
            document.getElementById('gameOverOverlay').style.display = 'flex';
            document.getElementById('gameoverGems').textContent = gemsCollected;
        } else {
            // IF Still have lives, reset level
            resetLevel()
        }

    }
}


// CRREATE GAME OBJECTS

// Game objects
const player = new Player({ x: 50, y: 100 })

const background = new Sprite({
    position: { x: 0, y: 0 },
    imageSrc: "./assets/images/daytime_background.png",
    width: canvas.width,
    height: canvas.height
})

// Load the open door image (will be drawn when door opens)
const openDoorImage = new Image();
openDoorImage.src = "./assets/images/daytime_open_door.png";

// ITEM SPRITES MANAGEMENT

// Array to hold all item sprites that need to be drawn(gems, key, open door)
const itemSprites = []

// Update the list of item sprites based on current map state
function updateItemSprites() {
    itemSprites.length = 0 // clear the array

    // add all remaining gems
    gemPositions.forEach(gem => {
        if (collisionsMap[gem.row] && collisionsMap[gem.row][gem.col] === 5) {
            itemSprites.push(new Sprite({
                position: {
                    x: gem.col * blockSize,
                    y: gem.row * blockSize
                },
                imageSrc: "./assets/images/gem.png",
                width: blockSize * 2,
                height: blockSize * 2
            }))
        }
    })

    // Add key if not collected
    if (keyPosition && !hasKey) {
        if (collisionsMap[keyPosition.row] && collisionsMap[keyPosition.row][keyPosition.col] === 6) {
            itemSprites.push(new Sprite({
                position: {
                    x: keyPosition.col * blockSize,
                    y: keyPosition.row * blockSize
                },
                imageSrc: "./assets/images/key.png",
                width: blockSize * 2,
                height: blockSize * 3
            }))
        }
    }

    // Add open door if player has key (fixed position for this level)
    if (hasKey) {
        itemSprites.push(new Sprite({
            position: {
                x: 1110,
                y: doorPosition.row * blockSize
            },
            imageSrc: "./assets/images/daytime_open_door.png",
            width: blockSize * 12,
            height: blockSize * 12
        }))
    }

}

// Initialize item sprites
updateItemSprites()

// ===== UI DRAWING FUNCTIONS =====
// These functions draw the game UI (hearts, gems, key, timer)
function drawHearts() {
    c.font = "30px Arial"
    for (let i = 0; i < lives; i++) {
        c.fillText("❤️", 20 + (i * 35), 40)
    }
}

function drawGems() {
    c.font = "30px Arial"
    c.fillStyle = "gold"
    c.fillText(`💎 ${gemsCollected}`, canvas.width / 2 - 40, 40)
}

function drawKey() {
    c.fillStyle = "gold"
    c.font = "30px Arial"
    c.fillText(`🔑 ${hasKey ? "✓" : "✗"}`, canvas.width / 2 + 60, 40)
}

function drawTimer() {
    c.fillStyle = "gold"
    c.font = "30px Arial"

    let minutes = Math.floor(timeLeft / 60)
    let seconds = timeLeft % 60
    if (seconds < 10) seconds = "0" + seconds

    c.fillText(`⏱ ${minutes}:${seconds}`, canvas.width - 150, 40)
}

// DOOR OPENING LOGIQUE
// ===== DOOR CHECK: IF player touching the key =====
function checkDoorOpen() {
    if (!doorPosition || !hasKey || gameWon) return;

    const doorX = doorPosition.col * blockSize
    const doorY = doorPosition.row * blockSize

    // Check if player rectangle overlaps with door rectangle
    const touchingDoor =
        player.position.x + player.width > doorX &&
        player.position.x < doorX + blockSize * 12 &&
        player.position.y + player.height > doorY &&
        player.position.y < doorY + blockSize * 12

    if (hasKey && touchingDoor) {
        gameWon = true

        // SHOW WIN OVERLAY
        document.getElementById('winOverlay').style.display = 'flex';
        document.getElementById('winGems').textContent = `${gemsCollected}/${totalGems}`;

        let minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;
        if (seconds < 10) seconds = "0" + seconds;
        document.getElementById('winTime').textContent = `${minutes}:${seconds}`;

    }

}

// ===== SECTION 12: MENU SCREEN =====

// Button positions
const startButton = { x: canvas.width / 2 - 100, y: 200, width: 200, height: 50 };
const aboutButton = { x: canvas.width / 2 - 100, y: 270, width: 200, height: 50 };
const restartButton = { x: canvas.width / 2 - 100, y: 270, width: 200, height: 50 };
const nextButton = { x: canvas.width / 2 - 100, y: 340, width: 200, height: 50 };
const homeButton = { x: canvas.width / 2 - 100, y: 340, width: 200, height: 50 };


// function drawGameOver() {
//     c.fillStyle = "rgba(0,0,0,0.7)";
//     c.fillRect(0, 0, canvas.width, canvas.height);

//     c.fillStyle = "white";
//     c.font = "60px Arial";
//     c.fillText("GAME OVER", canvas.width / 2 - 180, canvas.height / 2 - 50);

//     c.font = "30px Arial";
//     c.fillText(`You collected ${gemsCollected} gems`, canvas.width / 2 - 130, canvas.height / 2 + 20);

//     // c.fillStyle = "#f12d0f";
//     // c.fillRect(restartButton.x, restartButton.y, restartButton.width, restartButton.height);
//     // c.fillStyle = "black";
//     // c.fillText("RESTART", restartButton.x + 50, restartButton.y + 35);

//     // c.fillStyle = "#3498db";
//     // c.fillRect(homeButton.x, homeButton.y, homeButton.width, homeButton.height);
//     // c.fillStyle = "black";
//     // c.fillText("HOME", homeButton.x + 70, homeButton.y + 35);

// }

// LEVEL RESET FUNCTIONS

// Reset the current level (keep lives)
function resetLevel() {
    // Reset player position
    player.position.x = 50;
    player.position.y = 100;
    player.velocity.x = 0;
    player.velocity.y = 0;

    // Reset level state but keep lives
    hasKey = false;
    gemsCollected = 0;
    timeLeft = 30;

    // Restore original collisions map
    for (let row = 0; row < collisionsMap.length; row++) {
        for (let col = 0; col < collisionsMap[0].length; col++) {
            collisionsMap[row][col] = originalCollisionsMap[row][col];
        }
    }

    // Rescan for item positions
    gemPositions = [];
    keyPosition = null;
    doorPosition = null;
    totalGems = 0;

    // Rescan for item positions
    for (let row = 0; row < collisionsMap.length; row++) {
        for (let col = 0; col < collisionsMap[0].length; col++) {
            const block = collisionsMap[row][col];
            if (block === 5) {
                gemPositions.push({ row, col });
                totalGems++;
            }
            if (block === 6 && !keyPosition) {
                keyPosition = { row, col };
            }
            if (block === 2 && !doorPosition) {
                doorPosition = { row, col };
            }
        }
    }


    updateUI()
}

// Reset entire game (lives too)
function resetGame() {
    lives = 3;
    resetLevel();
    timeLeft = 30;
    updateUI()
}

// Update UI function

// Update the HTML elements that display game stats
function updateUI() {
    document.getElementById('lives-display').textContent = lives;
    document.getElementById('gems-display').textContent = `${gemsCollected}/${totalGems}`;
    document.getElementById('key-display').textContent = hasKey ? "✓" : "✗";

    let minutes = Math.floor(timeLeft / 60);
    let seconds = timeLeft % 60;
    if (seconds < 10) seconds = "0" + seconds;
    document.getElementById('timer-display').textContent = `${minutes}:${seconds}`;
}

//game timer

// Countdown timer that runs every second
setInterval(() => {
    if (gameState === "playing" && !gameWon) {
        timeLeft--;
        console.log("Timer:", timeLeft);
        if (timeLeft <= 0) {
            player.die()

        }
    }
}, 1000);


// ===== SECTION 16: MAIN GAME LOOP =====
// This function runs 60 times per second and handles all drawing
function animate() {
    //it tells to run the animation before the next screen repaint
    requestAnimationFrame(animate); // it is used to create the main game loop

    if (gameState === "playing") { // clear canva with black
        // Clear canvas
        c.fillStyle = "black";
        c.fillRect(0, 0, canvas.width, canvas.height);

        background.draw();

        updateItemSprites();
        itemSprites.forEach(sprite => sprite.draw());
        player.update();

        //Draw UI
        drawHearts();
        drawGems();
        drawKey();
        drawTimer();

        checkDoorOpen();
    } else if (gameState === "win") {
        // draw win screen 
        c.fillStyle = "black";
        c.fillRect(0, 0, canvas.width, canvas.height);
        background.draw();
        drawWinMenu();
    } else if (gameState === "gameover") {
        //drawGameOver screen
        c.fillStyle = "black";
        // c.fillRect(0, 0, canvas.width, canvas.height);
        // drawGameOver();
    }
}

animate();


// ===== KEYBOARD CONTROLS =====
const keys = { right: false, left: false }; //

window.addEventListener("keydown", (event) => {
    if (gameState === "playing") {
        switch (event.key) {
            case "ArrowRight":
                player.velocity.x = 3; // move right
                keys.right = true;
                break;
            case "ArrowLeft":
                player.velocity.x = -3; // move left
                keys.left = true;
                break;
            case "ArrowUp":
                if (player.onGround) {
                    player.velocity.y = -14; //jumps negative
                }
                break;
            case "Esc":
                gameState = "menu"
        }
    }

    //menu navigation
    if (event.key === "Esc") {
        if (gameState === "about") {
            gameState = "menu";
        }

    }

    if (event.key === "Enter") {
        if (gameState === "win" || gameState === "gameover") {
            gameState = "playing";
            resetGame();
        }
    }
});

window.addEventListener("keyup", (event) => {
    switch (event.key) {
        case "ArrowRight":
            if (!keys.left) player.velocity.x = 0;
            keys.right = false;
            break;
        case "ArrowLeft":
            if (!keys.right) player.velocity.x = 0;
            keys.left = false;
            break;
    }
});

// ===== MOUSE CONTROLS =====
// Handle mouse clicks on menu buttons
canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;


    if (gameState === "menu") {
        if (mouseX > startButton.x && mouseX < startButton.x + startButton.width &&
            mouseY > startButton.y && mouseY < startButton.y + startButton.height) {
            gameState = "playing";
            resetGame();
        }
        if (mouseX > aboutButton.x && mouseX < aboutButton.x + aboutButton.width &&
            mouseY > aboutButton.y && mouseY < aboutButton.y + aboutButton.height) {
            gameState = "about";
        }
    }

    if (gameState === "win") {
        if (mouseX > restartButton.x && mouseX < restartButton.x + restartButton.width &&
            mouseY > restartButton.y && mouseY < restartButton.y + restartButton.height) {
            gameState = "playing";
            resetGame();
        }

        if (mouseX > nextButton.x && mouseX < nextButton.x + nextButton.width &&
            mouseY > nextButton.y && mouseY < nextButton.y + nextButton.height) {
            // Go to next level
            window.location.href = "../level2/index.html";
        }
    }

    if (gameState === "gameover") {
        if (mouseX > restartButton.x && mouseX < restartButton.x + restartButton.width &&
            mouseY > restartButton.y && mouseY < restartButton.y + restartButton.height) {
            gameState = "playing";
            resetGame();
        }
        if (mouseX > homeButton.x && mouseX < homeButton.x + homeButton.width &&
            mouseY > homeButton.y && mouseY < homeButton.y + homeButton.height) {
            gameState = "menu";
        }

    };
})

//make the reset game available globally for html buttons
window.resetGame = resetGame;
window.gameState = gameState;