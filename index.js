// Get the canvas element and its 2D rendering context
    const canvas = document.querySelector("canvas");
    const ctx = canvas.getContext("2d");

    // Store the canvas width and height for easier reference
    const width = canvas.width;
    const height = canvas.height;

    // Create a new image object for the background image
    const background = new Image();
    background.crossOrigin = "anonymous"; // correct tainted image
    background.src = "assets/water at park.jpg"; // Replace with your image path
    

    // Define a timeout to control the frame rate (~30fps)
    const timeout = 33; 

    // Array to store all the ripples
    let ripples = [];

    // === Global Ripple Settings ===
    // These settings define the behavior of all ripples on the canvas
    const GLOBAL_SETTINGS = {
        growthSpeed: 2,   // Speed at which the ripple grows (in pixels per frame)
        amplitude: 50,    // Maximum distortion of pixels in pixels
        wavelength: 500,  // Determines the frequency of the wave
        ringWidth: 10,    // Thickness of the ripple rings
        maxAge: 100,      // Maximum lifespan of a ripple (in frames)
        maxRipples: 50,   // Max number of ripples on the screen at once (for performance)
    };

// The Ripple class defines the properties and behavior of each ripple
    class Ripple {
        constructor(x, y, settings = GLOBAL_SETTINGS) {
            // Initialize ripple properties
            this.x = x;                      // X position of the ripple
            this.y = y;                      // Y position of the ripple
            this.age = 0;                    // Age of the ripple (used for lifespan and fading)
            this.maxAge = settings.maxAge;   // Max age of this ripple
            this.growthSpeed = settings.growthSpeed;  // How fast the ripple grows
            this.amplitude = settings.amplitude;      // Maximum distortion caused by the ripple
            this.wavelength = settings.wavelength;    // The wavelength of the wave effect
            this.ringWidth = settings.ringWidth;      // The width of the ripple ring
            this.initialRadius = settings.initialRadius || 0; // Optional initial radius, used for larger ripples on click
        }

        // Calculate the current radius of the ripple based on its age and growth speed
        get radius() {
            return this.initialRadius + this.age * this.growthSpeed;  // Adding initial radius for larger starting size
        }

        // Calculate the fade effect based on the age of the ripple
        get fade() {
            return 1 - this.age / this.maxAge;  // Fade the ripple over time
        }

        // Check if the ripple is still alive (i.e., not past its maximum age)
        isAlive() {
            return this.age < this.maxAge;
        }

        // Increment the age of the ripple
        incrementAge() {
            this.age++;
        }
    }
    


// Event listener for mouse clicks to create click-based ripples
    canvas.addEventListener("click", function (e) {
        const rect = canvas.getBoundingClientRect();  // Get canvas bounds
        const x = e.clientX - rect.left;  // Calculate mouse X position on canvas
        const y = e.clientY - rect.top;   // Calculate mouse Y position on canvas

        // Create a ripple at the click location with default settings
        const settings = {
            growthSpeed: 1.5,  // Slower growth speed for click ripples
            maxAge: 150,       // Longer lifespan for click ripples
            amplitude: 80,     // Larger distortion for click ripples
            wavelength: 50,
            ringWidth: 6,
            initialRadius: 30  // Initial radius set to 30 for a larger starting ripple
        };

        ripples.push(new Ripple(x, y, settings));  // Add the new ripple to the array

        // Limit the number of ripples to improve performance by removing the oldest if necessary
        if (ripples.length > GLOBAL_SETTINGS.maxRipples) {
            ripples.shift(); // Remove the oldest ripple
        }
    });

 // this function draws the background image onto the canvas
    function drawBackground() {
        ctx.drawImage(background, 0, 0, width, height);  // Draw the background image scaled to canvas size
    }

    //this function is used to draw all ripples onto the canvas with distortion effects
    function drawRipples() {
        // Get the current image data from the canvas
        let imageData = ctx.getImageData(0, 0, width, height);
        let data = imageData.data;

        // Create a new image data object to hold the distorted pixel values
        let newImageData = ctx.createImageData(width, height);
        let newData = newImageData.data;

        // Loop through each pixel on the canvas to apply the ripple effect
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let offsetX = 0;
                let offsetY = 0;

                // Loop through each ripple to calculate its impact on the current pixel
                for (let ripple of ripples) {
                    let dx = x - ripple.x;
                    let dy = y - ripple.y;
                    let dist = Math.sqrt(dx * dx + dy * dy) + 0.01;  // Calculate the distance to the ripple center

                    let radius = ripple.radius;
                    let fade = ripple.fade;  // Apply fade effect based on age of the ripple

                    // Only apply distortion if the pixel is near the ripple's ring
                    if (dist > radius - ripple.ringWidth && dist < radius + ripple.ringWidth) {
                        let wave = Math.sin((dist - radius) / ripple.wavelength) * ripple.amplitude * fade;

                        // Calculate the distortion offsets based on the wave
                        offsetX += (dx / dist) * wave;
                        offsetY += (dy / dist) * wave;
                    }
                }

                // Apply the calculated distortion to the pixel's position
                let sx = Math.floor(x + offsetX);
                let sy = Math.floor(y + offsetY);

                if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
                    let srcIndex = (sy * width + sx) * 4;  // Get the source pixel index
                    let dstIndex = (y * width + x) * 4;   // Get the destination pixel index

                    // Copy the pixel color from the source to the distorted position
                    newData[dstIndex] = data[srcIndex];
                    newData[dstIndex + 1] = data[srcIndex + 1];
                    newData[dstIndex + 2] = data[srcIndex + 2];
                    newData[dstIndex + 3] = data[srcIndex + 3];
                }
            }
        }

        // Apply the new image data (with distortion) to the canvas
        ctx.putImageData(newImageData, 0, 0);
    }

// The main update function that continuously redraws the canvas
    function update() {
        drawBackground();  // Draw the background image
        drawRipples();     // Draw the ripples with distortion

        // Remove expired ripples and update the remaining ones
        ripples = ripples.filter(ripple => {
            ripple.incrementAge();  // Increase the age of each ripple
            return ripple.isAlive();  // Keep only alive ripples
        });

        // Request the next animation frame
        setTimeout(update, timeout);  // Call the update function after a delay to control frame rate
    }

    // Start the animation once the background image has loaded
    background.onload = function () {
        update();  // Begin the update loop
    };