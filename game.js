// The game itself
var game;

// Background for the game
var background;

// The ball you are about to fire
var ball;

// The rectangle where you can place the ball and charge the launch power
var launchRectangle = new Phaser.Rectangle(30, 400, 250, 170);

// Here we will draw the predictive trajectory
var trajectoryGraphics;

// A simple multiplier to increase launch power
var forceMult = 5;

// Stored launch velocity
var launchVelocity;

// This is the compound object which will represent the bucket
var bucketBody;

// Kill object
var deadZone;

// We are going to create a moving bucket, so this is bucket speed
var bucketSpeed = 160;

// New moving object
var movingWall;

// Speed of movingWall object
var wallSpeed = 100;

var sound;

// Function to be executed when the window loads
window.onload = function() {
    // Starting the game itself
    game = new Phaser.Game(800, 600, Phaser.AUTO, "");
    // Creation and execution of "PlayGame" state
    game.state.add("PlayGame", playGame);
    game.state.start("PlayGame");
};

var playGame = function(game) {};

playGame.prototype = {
    // Preloading graphics and audio assets
    preload: function() {
        game.load.image("background", "images/background.png");
        game.load.image("ball", "images/ball.png");
        game.load.audio("noProblem", "audio/noproblem.mp3");
        game.load.audio("laugh", "audio/laugh.mp3");
        game.load.audio("lucky", "audio/lucky.mp3");

    },
    // Function to be executed once the game has been created
    create: function() {
        // Added background image sprite
        background = game.add.tileSprite(0, 0, 800, 600, "background");

        // Adding a new graphics and drawing the launch rectangle in it
        var launchGraphics = game.add.graphics(0, 0);
        launchGraphics.lineStyle(3, 0x00ff00);
        launchGraphics.drawRect(launchRectangle.x, launchRectangle.y, launchRectangle.width, launchRectangle.height);

        // Also adding the graphics where we'll draw the trajectory
        trajectoryGraphics = game.add.graphics(0, 0);

        // Setting initial launch velocity to zero
        launchVelocity = new Phaser.Point(0, 0);

        // Initializing Box2D physics
        game.physics.startSystem(Phaser.Physics.BOX2D);

        // Setting gravity
        game.physics.box2d.gravity.y = 500;
        game.physics.box2d.setBoundsToWorld();

        // Waiting for player input then call placeBall function
        game.input.onDown.add(placeBall);

        // This is how we build the bucket as a compound body
        // It's a kinematic body so it will act as a static body, but it will also react to forces
        bucketBody = new Phaser.Physics.Box2D.Body(game, null, 500, 440, 1);
        bucketBody.restitution = 0.8;
        bucketBody.addRectangle(120, 10, 0, 0);
        bucketBody.addRectangle(10, 110, -55, -60);
        bucketBody.addRectangle(10, 110, 55, -60);

        // Another kinematic body
        movingWall = new Phaser.Physics.Box2D.Body(game, null, 571, 50, 1);
        movingWall.restitution = 0.1;
        movingWall.addRectangle(10, 80, 0, 0);

				// Makes movingWall move in the y axis (up and down)
        movingWall.velocity.y = wallSpeed;

        // Placing static objects to make the game a bit harder
        var bar1Body = new Phaser.Physics.Box2D.Body(game, null, 350, 360, 0);
        bar1Body.setRectangle(50, 500, 0, 0);

        var bar2Body = new Phaser.Physics.Box2D.Body(game, null, 470, 115, 0);
        bar2Body.setRectangle(190, 10, 0, 0);
        bar2Body.restitution = 0.1;

        var bar3Body = new Phaser.Physics.Box2D.Body(game, null, 735, 210, 0);
        bar3Body.setRectangle(150, 10, 0, 0, Math.PI / -7);
        bar3Body.restitution = 0.1;

        // Adding bitmapData graphics by drawing in Canvas
        // First middle wall
        var wall = game.add.bitmapData(128, 500);

        // Drawing on canvas
        wall.ctx.beginPath();
        wall.ctx.rect(0, 0, 50, 1000);
        wall.ctx.fillStyle = 'pink';
        wall.ctx.fill();

        var wally = game.add.sprite(325, 110, wall);

        // The upper plank
        var plank = game.add.bitmapData(300, 128);

        // Drawing on canvas
        plank.ctx.beginPath(bar2Body);
        plank.ctx.rect(0, 0, 191, 10);
        plank.ctx.fillStyle = 'pink';
        plank.ctx.fill();

        var planky = game.add.sprite(375, 110, plank);

        // Deadzone for the ball to be destroyed on collision
        deadZone = new Phaser.Physics.Box2D.Body(game, null, 400, 600, 1);

        var destroy = deadZone.addRectangle(800, 1, 0, 0);
        // Telling the object to kill the ball when it hits the object
        destroy.m_userData = "die";
				// Links the collision so the collision kills the ball
				deadZone.setCollisionCategory(2);

        // A sensor to detect if the ball is inside the bucket
        var sensor = bucketBody.addRectangle(100, 70, 0, -40);
        sensor.m_isSensor = true;
        // Adding custom user data to give bucket sensor a name
        sensor.m_userData = "inside";
        // Setting bucket bitmask to check for selective collisions
        bucketBody.setCollisionCategory(2);
        // Setting bucket horizontal velocity
        bucketBody.velocity.x = bucketSpeed;

    },
    render: function() {
        // This is the debug draw in action
        game.debug.box2dWorld();
    },
    update: function() {
        // This makes the background move along the X axis
        background.tilePosition.x += 0.2;
        // Updating create velocity according to its position
        if (bucketBody.x > 710) {
            bucketBody.velocity.x = -bucketSpeed;
        }
        if (bucketBody.x < 500) {
            bucketBody.velocity.x = bucketSpeed;
        }
        if (movingWall.y > 155) {
            movingWall.velocity.y = -wallSpeed;
        }
        if (movingWall.y < 70) {
            movingWall.velocity.y = wallSpeed;
        }
    }
};

// This function will place the ball
function placeBall(e) {
    // We place a new ball only if we are inside launch rectangle
    if (launchRectangle.contains(e.x, e.y)) {
        // Adding ball sprite
        ball = game.add.sprite(e.x, e.y, "ball");
        // Enabling physics to ball sprite
        game.physics.box2d.enable(ball);
        // Temporarily set ball gravity to zero, so it won't fall down
        ball.body.gravityScale = 0;
        // Telling Box2D we are dealing with a circle shape
        ball.body.setCircle(ball.width / 2);
        ball.body.restitution = 0.8;
        // Removing onDown listener
        game.input.onDown.remove(placeBall);
        // When the player ends the input call launchBall function
        game.input.onUp.add(launchBall);
        // When the player moves the input call chargeBall
        game.input.addMoveCallback(chargeBall);
    }
}

// This function will allow the player to charge the ball before the launch, and it's the core of the example
function chargeBall(pointer, x, y, down) {
    // We do not allow multitouch, so we are only handling pointer which id is zero
    if (pointer.id === 0) {
        // Clearing trajectory graphics, setting its line style and move the pen on ball position
        trajectoryGraphics.clear();
        trajectoryGraphics.lineStyle(3, 0x00ff00);
        trajectoryGraphics.moveTo(ball.x, ball.y);
        // Now we have two options: the pointer is inside the launch rectangle...
        if (launchRectangle.contains(x, y)) {
            // ... and in this case we simply draw a line to pointer position
            trajectoryGraphics.lineTo(x, y);
            launchVelocity.x = ball.x - x;
            launchVelocity.y = ball.y - y;
        }
        // ... but the pointer can also be OUTSIDE launch rectangle
        else {
            // ... in this case we have to check for the intersection between launch line and launch rectangle
            var intersection = lineIntersectsRectangle(new Phaser.Line(x, y, ball.x, ball.y), launchRectangle);
            trajectoryGraphics.lineTo(intersection.x, intersection.y);
            launchVelocity.x = ball.x - intersection.x;
            launchVelocity.y = ball.y - intersection.y;
        }
        // Now it's time to draw the predictive trajectory
        trajectoryGraphics.lineStyle(1, 0x00ff00);
        launchVelocity.multiply(forceMult, forceMult);
        for (var i = 0; i < 60; i += 5) {
            var trajectoryPoint = getTrajectoryPoint(ball.x, ball.y, launchVelocity.x, launchVelocity.y, i);
            trajectoryGraphics.moveTo(trajectoryPoint.x - 3, trajectoryPoint.y - 3);
            trajectoryGraphics.lineTo(trajectoryPoint.x + 3, trajectoryPoint.y + 3);
            trajectoryGraphics.moveTo(trajectoryPoint.x - 3, trajectoryPoint.y + 3);
            trajectoryGraphics.lineTo(trajectoryPoint.x + 3, trajectoryPoint.y - 3);
        }
    }
}

// Function to launch the ball
function launchBall() {
    // Adjusting callbacks
    game.input.deleteMoveCallback(0);
    game.input.onUp.remove(launchBall);
    game.input.onDown.add(placeBall);
    // Setting ball velocity
    ball.body.velocity.x = launchVelocity.x;
    ball.body.velocity.y = launchVelocity.y;
    // Applying the gravity to the ball
    ball.body.gravityScale = 1;
    // Ball collision listener callback
    ball.body.setCategoryContactCallback(2, ballHitsBucket);
}

// Function to be executed when the ball hits the bucket
function ballHitsBucket(body1, body2, fixture1, fixture2, begin) {
    // Body1 is the ship because it's the body that owns the callback
    // Body2 is the body it impacted with, in this case the enemy
    // Fixture1 is the fixture of body1 that was touched
    // Fixture2 is the fixture of body2 that was touched

    // We only want this to happen when the hit begins
    if (begin) {
        // If the ball hits the sensor inside...
        if (fixture2.m_userData == "inside") {
            // Setting restitution to zero to prevent the ball to jump off the box, but it's just a "hey I got the collision" test
            body1.restitution = 0;
            // Now the ball looks for a contact category which does not exist, so we won't trigger anymore the contact with the sensor
            body1.setCategoryContactCallback(4, ballHitsBucket);
            sound = game.add.audio('lucky');
            sound.play();
        }
        // If the ball hits the ground collision, destroy it.
        if (fixture2.m_userData == "die") {
            body1.sprite.destroy();
            sound = game.add.audio("noProblem");
            sound.play();
        }
        // if (fixture1.m_userData == "die") {
        //     body2.sprite.destroy();
        //     sound = game.add.audio("lucky");
        //     sound.play();
        // }
    }
}

// Function to check for intersection between a segment and a rectangle
function lineIntersectsRectangle(l, r) {
    return l.intersects(new Phaser.Line(r.left, r.top, r.right, r.top), true) ||
        l.intersects(new Phaser.Line(r.left, r.bottom, r.right, r.bottom), true) ||
        l.intersects(new Phaser.Line(r.left, r.top, r.left, r.bottom), true) ||
        l.intersects(new Phaser.Line(r.right, r.top, r.right, r.bottom), true);
}

// Function to calculate the trajectory point taken from http://phaser.io/examples/v2/box2d/projected-trajectory
function getTrajectoryPoint(startX, startY, velocityX, velocityY, n) {
    var t = 1 / 60;
    var stepVelocityX = t * game.physics.box2d.pxm(-velocityX);
    var stepVelocityY = t * game.physics.box2d.pxm(-velocityY);
    var stepGravityX = t * t * game.physics.box2d.pxm(-game.physics.box2d.gravity.x);
    var stepGravityY = t * t * game.physics.box2d.pxm(-game.physics.box2d.gravity.y);
    startX = game.physics.box2d.pxm(-startX);
    startY = game.physics.box2d.pxm(-startY);
    var tpx = startX + n * stepVelocityX + 0.5 * (n * n + n) * stepGravityX;
    var tpy = startY + n * stepVelocityY + 0.5 * (n * n + n) * stepGravityY;
    tpx = game.physics.box2d.mpx(-tpx);
    tpy = game.physics.box2d.mpx(-tpy);
    return {
        x: tpx,
        y: tpy
    };
}
