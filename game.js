// Setup Matter.js"
const Engine = Matter.Engine,
World = Matter.World,
Bodies = Matter.Bodies,
Events = Matter.Events;

var runner = Matter.Runner.create();
const engine = Engine.create();
const world = engine.world;

// Disable gravity
world.gravity.x = 0;
world.gravity.y = 0;

const canvasWidth = window.innerWidth;
const canvasHeight = window.innerHeight;
function createRender (background = '#FFF5E4') { // background - https://colorhunt.co/palette/fff5e4ffe3e1ffd1d1ff9494
    return Matter.Render.create({
        element: document.body,
        engine: engine,
        options: {
        width: canvasWidth,
        height: canvasHeight,
        wireframes: false, // Disable wireframes for bodies
        background: background 
        },
        });
};
// Create canvas
let render = createRender() 

// Create the green zone (ring)
const greenZone = Bodies.circle(canvasWidth / 2 - 7, canvasHeight / 2, window.innerWidth/2 - 10, {
isSensor: true,
isStatic: true,
render: {
fillStyle: 'rgb(180, 240, 228)',
strokeStyle: 'transparent'
},
});
World.add(world, greenZone);

// Create the red zone (inner circle)
const redZone = Bodies.circle(canvasWidth / 2- 7, canvasHeight / 2, window.innerWidth/4, {
isSensor: true,
isStatic: true,
render: {
fillStyle: 'rgb(230, 148, 148)',
strokeStyle: 'transparent'
},
});
World.add(world, redZone);



// Create player circle
const player = Bodies.circle(canvasWidth / 2, canvasHeight / 2, window.innerWidth/8, {
restitution: 0,
render: {
fillStyle: 'rgb(200, 200, 225)',
strokeStyle: 'transparent', // No stroke
},
});
World.add(world, player);

// Create the "poke" circle
const poke = Bodies.circle(canvasWidth / 2, canvasHeight / 2, window.innerWidth/12, {
restitution: 1,
render: {
fillStyle: 'rgb(255, 209, 209)',
strokeStyle: 'transparent', // No stroke
},
});
World.add(world, poke);

// Track time in red zone and game start time
let timeInRedZone = 0;
let gameStartTime = Date.now();
let score = 0;
let maxScore = 0;
let prevTs = 0;
const initDifficulty = 0.04;
let difficulty = initDifficulty;
let scoreMultiplier = 0.12;
let difficultyMultiplyer = 1.00001;
let chanceOfApplyingRandomForce = 0.005; // 1 in 500
const minRandomForceMagnitude = 0.02; // Minimum force magnitude
const maxRandomForceMagnitude = 0.023; // Maximum force magnitude


// Listen for collision events
Events.on(engine, 'collisionStart', (event) => {
const pairs = event.pairs;

for (let i = 0; i < pairs.length; i++) {
const pair = pairs[i];

if ((pair.bodyA === poke && pair.bodyB === redZone) || (pair.bodyA === redZone && pair.bodyB === poke)) {
timeInRedZone = 0;
}
}
});

// Mouse and touch control for player
document.addEventListener("mousemove", (event) => {
Matter.Body.setPosition(player, { x: event.clientX, y: event.clientY });
});

document.addEventListener("touchmove", (event) => {
event.preventDefault(); // Prevent scrolling
const touch = event.touches[0];
Matter.Body.setPosition(player, { x: touch.clientX, y: touch.clientY });
});

// Game loop
Matter.Events.on(runner, 'afterTick', (event) => {
    // Update the score display
    $('#scoreDisplay')[0].textContent = "Score: " + Math.floor(score) + "\r\n";
    if (maxScore > 0)
    $('#scoreDisplay')[0].textContent += "Top Score: " + Math.floor(maxScore);

    // Apply forces to move the "poke" towards the center of the red zone
    const force = Matter.Vector.sub(redZone.position, poke.position);
    Matter.Body.applyForce(poke, poke.position, Matter.Vector.mult(Matter.Vector.normalise(force), difficulty));

    // random force //
    if (Math.random() < chanceOfApplyingRandomForce && score > 10) {
    console.log("random force")
    // Generate random components for the force vector
    const randomForceX = Math.random() * (maxRandomForceMagnitude - minRandomForceMagnitude) + minRandomForceMagnitude;
    const randomForceY = Math.random() * (maxRandomForceMagnitude - minRandomForceMagnitude) + minRandomForceMagnitude;

    // Create the force vector
    const randomForce = {
    x: randomForceX,
    y: randomForceY
    };
    Matter.Body.applyForce(poke, poke.position, randomForce, difficulty * 10);
    }

    // Check if "poke" is inside the red zone
    if (Matter.Bounds.contains(redZone.bounds, poke.position)) {
    timeInRedZone += (event.timestamp - prevTs) / 1000; 
    if (timeInRedZone > 3) {
    console.log("Game Over! score:", score, difficulty);
    if (score > maxScore) {
        maxScore = score;
    }
    $('#gameOver').modal('show');
    Matter.Runner.stop(runner);
    Matter.Render.stop(render);
    }
    }

    // Check if "poke" is inside the green zone
    if (Matter.Bounds.contains(greenZone.bounds, poke.position) && 
    !Matter.Bounds.contains(redZone.bounds, poke.position)) {
    score += scoreMultiplier; 
    }
    prevTs = event.timestamp
    difficulty *= difficultyMultiplyer
});

document.getElementById('startButton').addEventListener('click', function() {
    $('#explainModal').modal('hide');
    // Start the render and runner
    $('#scoreDisplay')[0].style.visibility = "visible";
    Matter.Render.run(render);
    Matter.Runner.run(runner, engine);
});

document.getElementById('reviveButton').addEventListener('click', function() {
    gameStartTime = Date.now(); // Reset the game start time
    timeInRedZone = 0; // Reset the time in red zone
    difficulty = initDifficulty;
    Matter.Body.setPosition(poke, { x: Math.random() * canvasWidth, y: Math.random() * canvasHeight })
    $('#gameOver').modal('hide');
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);
    });

document.getElementById('restartButton').addEventListener('click', function() {
    gameStartTime = Date.now(); // Reset the game start time
    timeInRedZone = 0; // Reset the time in red zone
    score = 0 // reset the score
    difficulty = initDifficulty;
    Matter.Body.setPosition(poke, { x: Math.random() * canvasWidth, y: Math.random() * canvasHeight })
    $('#gameOver').modal('hide');
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);
    });

document.getElementById('shareButton').addEventListener('click', function() {
    // Handle "Cancel" button click
    //TODO:add
    alert('You clicked "shareButton"');
    // You can add your custom logic here
    });