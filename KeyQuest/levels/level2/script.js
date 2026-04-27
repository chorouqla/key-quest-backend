// const savedLevel = localStorage.getItem("currentLevel");

// if (savedLevel !== "1") {
//     window.location.href = "../level1/index.html";
// }
//to reload and have level 1 

const canvas = document.querySelector("canvas")
const c = canvas.getContext("2d")

// Make canvas responsive
canvas.style.width = '100%';
canvas.style.height = 'auto';

canvas.width = 1390
canvas.height = 757

const gravity = 0.5
const blockSize = 16  // Each block in the map is 16x16 pixels
const mapWidth = 87

// let cameraOffset = { x: 0, y: 0 }
let hasKey = false
let gemsCollected = 0
let lives = 3
let timeLeft = 120
let gameWon = false


// Convert 1D collision array to 2D 
const collisionsMap = []
for (let i = 0; i < collisions.length; i += mapWidth) {
    collisionsMap.push(collisions.slice(i, i + mapWidth))
}

const originalCollisionsMap = JSON.parse(JSON.stringify(collisionsMap))

// Find positions of special items
let gemPositions = []
let keyPosition = null
let doorPosition = null


for (let row = 0; row < collisionsMap.length; row++) {
    for (let col = 0; col < collisionsMap[0].length; col++) {

        const block = collisionsMap[row][col]

        if (block === 5) {
            // Only take top-left of 2x2 group
            if (
                collisionsMap[row][col + 1] === 5 &&
                collisionsMap[row + 1] &&
                collisionsMap[row + 1][col] === 5 &&
                collisionsMap[row + 1][col + 1] === 5
            ) {
                gemPositions.push({ row, col })
            }
        }
        if (block === 6 && !keyPosition) {
            keyPosition = { row, col }
        }
        if (block === 2 && !doorPosition) {
            doorPosition = { row, col }
        }
    }
}

// UI Update Function for Level 2
function updateUI() {
    document.getElementById('lives-display').textContent = lives;
    document.getElementById('gems-display').textContent = gemsCollected;
    document.getElementById('key-display').textContent = hasKey ? "✓" : "✗";
    document.getElementById('key-display').setAttribute('data-haskey', hasKey);

    let minutes = Math.floor(timeLeft / 60);
    let seconds = timeLeft % 60;
    if (seconds < 10) seconds = "0" + seconds;
    document.getElementById('timer-display').textContent = `${minutes}:${seconds}`;

    // Add warning class when time is low
    const timerElement = document.getElementById('timer-display');
    if (timeLeft <= 30) {
        timerElement.classList.add('warning');
    } else {
        timerElement.classList.remove('warning');
    }
}

function resetGame() {
    // Reset player position
    player.position.x = 50;
    player.position.y = collisionsMap.length * blockSize - 200;
    player.velocity.x = 0;
    player.velocity.y = 0;

    // Reset game state
    lives = 3;
    gemsCollected = 0;
    hasKey = false;
    gameWon = false;
    timeLeft = 120;

    // Reset collisions map
    for (let row = 0; row < collisionsMap.length; row++) {
        for (let col = 0; col < collisionsMap[0].length; col++) {
            collisionsMap[row][col] = originalCollisionsMap[row][col];
        }
    }

    // Reset positions
    gemPositions = [];
    keyPosition = null;
    doorPosition = null;

    // Rescan for item positions
    for (let row = 0; row < collisionsMap.length; row++) {
        for (let col = 0; col < collisionsMap[0].length; col++) {
            const block = collisionsMap[row][col];

            if (block === 5) {
                if (
                    collisionsMap[row][col + 1] === 5 &&
                    collisionsMap[row + 1] &&
                    collisionsMap[row + 1][col] === 5 &&
                    collisionsMap[row + 1][col + 1] === 5
                ) {
                    gemPositions.push({ row, col });
                }
            }
            if (block === 6 && !keyPosition) {
                keyPosition = { row, col };
            }
            if (block === 2 && !doorPosition) {
                doorPosition = { row, col };
            }
        }
    }

    // Update UI
    updateUI();
}

// console.log("Gem at:", gemPositions)
// console.log("Key at:", keyPosition)
// console.log("Door at:", doorPosition)

class Sprite {
    constructor({ position, imageSrc, width, height }) {
        this.position = position
        this.width = width
        this.height = height
        this.image = new Image()
        this.image.src = imageSrc
    }

    draw() {
        if (!this.image) return
        c.drawImage(
            this.image,
            // this.position.x - cameraOffset.x,
            // this.position.y - cameraOffset.y,
            this.position.x,
            this.position.y,
            this.width,
            this.height)
    }
}


class Player {
    constructor({ x, y }) {
        this.position = { x, y }
        this.velocity = { x: 0, y: 0 }
        this.width = 101 / 2
        this.height = 95 / 2

        this.onGround = false
        this.image = new Image()
        this.image.src = "./png/player.png"
    }

    draw() {
        if (this.image) {
            c.drawImage(
                this.image,
                // this.position.x - cameraOffset.x,
                // this.position.y - cameraOffset.y,
                this.position.x,
                this.position.y,
                this.width,
                this.height
            )
        } else {
            c.fillStyle = "red"
            c.fillRect(this.position.x, this.position.y, this.width, this.height)
        }
    }

    update() {
        // Apply gravity
        this.velocity.y += gravity
        this.onGround = false

        // Move horizontally
        this.position.x += this.velocity.x
        this.checkCollisions('x')

        // Move vertically
        this.position.y += this.velocity.y
        this.checkCollisions('y')

        // Keep player in canvas bounds
        // if (this.position.x < 0) this.position.x = 0
        // if (this.position.x + this.width > collisionsMap[0].length * blockSize)
        //     this.position.x = collisionsMap[0].length * blockSize - this.width

        this.draw()
    }

    checkCollisions(axis) {
        for (let row = 0; row < collisionsMap.length; row++) {
            for (let col = 0; col < collisionsMap[0].length; col++) {
                const block = collisionsMap[row][col]
                if (block === 0) continue

                const blockX = col * blockSize
                const blockY = row * blockSize

                // Check collision with this block
                if (this.position.x < blockX + blockSize &&
                    this.position.x + this.width > blockX &&
                    this.position.y < blockY + blockSize &&
                    this.position.y + this.height > blockY) {

                    this.handleBlockCollision(block, blockX, blockY, axis, row, col)
                }
            }
        }
    }

    handleBlockCollision(block, blockX, blockY, axis, row, col) {
        switch (block) {
            case 1: // Floor
                if (axis === 'y') {
                    if (this.velocity.y > 0) { // Falling down
                        this.position.y = blockY - this.height
                        this.velocity.y = 0
                        this.onGround = true
                    } else if (this.velocity.y < 0) { // Jumping up (hitting ceiling)
                        this.position.y = blockY + blockSize
                        this.velocity.y = 0
                    }
                }
                // } else if (axis === 'x') {
                //     // Horizontal collision
                //     if (this.velocity.x > 0) {
                //         this.position.x = blockX - this.width
                //     } else if (this.velocity.x < 0) {
                //         this.position.x = blockX + blockSize
                //     }
                // }
                break
            case 3: // Safe platform
                if (axis === 'y' && this.velocity.y > 0) {
                    // Only collide if falling onto platform from above AND feet are above the platform
                    this.position.y = blockY - this.height
                    this.velocity.y = 0
                    this.onGround = true
                }
                break

            case 4: // Spikes
                if (axis === 'y' && this.velocity.y > 0 &&
                    this.position.y + this.height > blockY &&
                    this.position.y + this.height <= blockY + 10) { // Only top 5 pixels of spikes kill
                    this.die()
                }
                break

            case 5:
                // Only collect if this is top-left of 2x2 gem
                if (
                    collisionsMap[row][col] === 5 &&
                    collisionsMap[row][col + 1] === 5 &&
                    collisionsMap[row + 1] &&
                    collisionsMap[row + 1][col] === 5 &&
                    collisionsMap[row + 1][col + 1] === 5
                ) {

                    // Remove full 2x2
                    for (let r = 0; r < 2; r++) {
                        for (let c = 0; c < 2; c++) {
                            collisionsMap[row + r][col + c] = 0
                        }
                    }

                    gemsCollected++
                    updateUI()
                }

                break

            case 6: // Key

                if (!hasKey) {
                    console.log("Key collected!")
                    hasKey = true
                    updateUI()

                    // Remove key blocks starting from THIS collision tile
                    for (let r = 0; r < 3; r++) {
                        for (let c = 0; c < 2; c++) {

                            const keyRow = row + r
                            const keyCol = col + c

                            if (
                                keyRow < collisionsMap.length &&
                                keyCol < collisionsMap[0].length &&
                                collisionsMap[keyRow][keyCol] === 6
                            ) {
                                collisionsMap[keyRow][keyCol] = 0
                            }
                        }
                    }
                }

                break
        }
    }

    die() {
        console.log("Player died!")
        lives--
        updateUI()
        if (lives <= 0) {
            // Game over - reset everything
            lives = 3
            gemsCollected = 0
            hasKey = false

            // Reset collisions map
            for (let row = 0; row < collisionsMap.length; row++) {
                for (let col = 0; col < collisionsMap[0].length; col++) {
                    collisionsMap[row][col] = originalCollisionsMap[row][col]
                }
            }
            // Reset positions
            gemPositions = []
            keyPosition = null
            doorPosition = null


            for (let row = 0; row < collisionsMap.length; row++) {
                for (let col = 0; col < collisionsMap[0].length; col++) {
                    const block = collisionsMap[row][col]
                    if (block === 5) {
                        if (
                            collisionsMap[row][col + 1] === 5 &&
                            collisionsMap[row + 1] &&
                            collisionsMap[row + 1][col] === 5 &&
                            collisionsMap[row + 1][col + 1] === 5
                        ) {
                            gemPositions.push({ row, col })  // Fixed - push to array
                        }
                    }

                    if (block === 6 && keyPosition === null) {
                        keyPosition = { row, col }
                    }

                    if (block === 2 && doorPosition === null) {
                        doorPosition = { row, col }
                    }
                }
            }
            updateUI()

        }

        this.position.x = 50
        this.position.y = 100
        this.velocity.x = 0
        this.velocity.y = 0

    }
}

// Game objects
const player = new Player({
    x: 50,
    y: collisionsMap.length * blockSize - 200
})

const background = new Sprite({
    position: { x: 0, y: 0 },
    imageSrc: "./png/background.png",
    width: canvas.width,
    height: canvas.height
})

const openDoorImage = new Image()
openDoorImage.src = "./png/door.open.png"

// Create sprites for items that need to be drawn (gems, key, open door)
const itemSprites = []

// Clear existing sprites
function updateItemSprites() {
    itemSprites.length = 0

    gemPositions.forEach(gem => {
        if (collisionsMap[gem.row] && collisionsMap[gem.row][gem.col] === 5) {
            itemSprites.push(new Sprite({
                position: {
                    x: gem.col * blockSize,
                    y: gem.row * blockSize
                },
                imageSrc: "./png/gem.png",
                width: blockSize * 1.5,
                height: blockSize * 1.5
            }))
        }
    })


    if (keyPosition && !hasKey) {
        itemSprites.push(new Sprite({
            position: {
                x: keyPosition.col * blockSize,
                y: keyPosition.row * blockSize
            },
            imageSrc: "./png/key.png",
            width: blockSize * 2,
            height: blockSize * 3
        }))
    }


}



// Initialize item sprites
updateItemSprites()

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

function checkDoorOpen() {
    if (!doorPosition || !hasKey) return

    const doorX = doorPosition.col * blockSize
    const doorY = doorPosition.row * blockSize

    const touchingDoor =
        player.position.x + player.width > doorX &&
        player.position.x < doorX + blockSize * 12 &&
        player.position.y + player.height > doorY &&
        player.position.y < doorY + blockSize * 12

    if (hasKey && touchingDoor) {
        gameWon = true
    }
}

function animate() {
    requestAnimationFrame(animate)

    // Clear canvas
    c.fillStyle = "#0a0f1f"
    c.fillRect(0, 0, canvas.width, canvas.height)


    // const mapWidthPixels = collisionsMap[0].length * blockSize
    // const mapHeightPixels = collisionsMap.length * blockSize

    // cameraOffset.x = Math.max(
    //     0,
    //     Math.min(
    //         player.position.x - canvas.width / 2 + player.width / 2,
    //         mapWidthPixels - canvas.width
    //     )
    // )

    // cameraOffset.y = Math.max(
    //     0,
    //     Math.min(
    //         player.position.y - canvas.height / 2 + player.height / 2,
    //         mapHeightPixels - canvas.height
    //     )
    // )

    // // Calculate scale to fit the 300px view onto your canvas
    // const scaleX = canvas.width / viewWidth;
    // const scaleY = canvas.height / viewHeight;
    // const scale = Math.min(scaleX, scaleY); // Use the smaller scale to maintain aspect ratio

    // c.save();
    // c.scale(scale, scale);
    // c.translate(-cameraOffset.x, -cameraOffset.y);

    background.draw()

    // if (cameraOffset.x < 0) cameraOffset.x = 0
    // if (cameraOffset.y < 0) cameraOffset.y = 0


    if (hasKey && doorPosition) {
        const doorX = doorPosition.col * blockSize - blockSize * 4
        const doorY = doorPosition.row * blockSize - blockSize * 3

        c.drawImage(
            openDoorImage,
            doorX,
            doorY,
            blockSize * 12,
            blockSize * 12,

        )
    }

    updateItemSprites()
    // Draw all item sprites
    itemSprites.forEach(sprite => sprite.draw())

    player.update()

    c.restore()

    // Draw UI
    drawHearts()
    drawGems()
    drawKey()
    drawTimer()

    checkDoorOpen()

    if (gameWon) {
        c.fillStyle = "rgba(0,0,0,0.7)"
        c.fillRect(0, 0, canvas.width, canvas.height)

        c.fillStyle = "white"
        c.font = "60px Arial"
        c.fillText("YOU WIN!", canvas.width / 2 - 170, canvas.height / 2 - 20)

        c.font = "30px Arial"
        c.fillText("Press R to Restart", canvas.width / 2 - 140, canvas.height / 2 + 40)

        return
    }
}


setInterval(() => {
    timeLeft--

    if (timeLeft <= 0) {
        lives--
        timeLeft = 120
        updateUI()

        if (lives <= 0) {
            c.fillStyle = "rgba(0,0,0,0.7)"
            c.fillRect(0, 0, canvas.width, canvas.height)
            c.fillStyle = "white"
            c.font = "60px Arial"
            c.fillText("GAME OVER", canvas.width / 2 - 180, canvas.height / 2)
            return
        }
    }
}, 1000)




// Keyboard controls
const keys = {
    right: false,
    left: false
}

window.addEventListener("keydown", (event) => {
    switch (event.key) {
        case "ArrowRight":
            player.velocity.x = 3
            keys.right = true
            break
        case "ArrowLeft":
            player.velocity.x = -3
            keys.left = true
            break
        case "ArrowUp":
            if (player.onGround) {
                player.velocity.y = -14
            }
            break
        case "r":
        case "R":
            resetGame();  // Call resetGame directly
            break
        case "enter":
            if (gameWon) {
                location.reload()
            }
            break
    }
})

window.addEventListener("keyup", (event) => {
    switch (event.key) {
        case "ArrowRight":
            if (!keys.left) player.velocity.x = 0
            keys.right = false
            break
        case "ArrowLeft":
            if (!keys.right) player.velocity.x = 0
            keys.left = false
            break
    }
})


animate()