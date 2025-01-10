const steak = document.getElementById('steak')
const josePics = document.getElementById('joseContainer')
console.log(josePics.getBoundingClientRect().width)
const joseMouth = document.getElementById('mouth')
let newX = 0, newY = 0, startX = 0, startY = 0
let resetX = `${(window.innerWidth / 2) - (steak.getBoundingClientRect().width / 2)}px`,
    resetY = '15%'

const setupJoseImages = (() => {
    let previousPictureState = null
    //Constantly read isSteakInMouth to switch between pictureStates library
    function joseObservingSteak(pictureState, isSteakInMouth) {

        const observingImages = document.querySelectorAll("#joseContainer .observe")
        console.log(observingImages[0])
        const pictureStates = {
            'idle': [0, '#808080'],
            'isSeen': [1, '#FFFF99'],
            'isNear': [2, '#FFCC66'],
            'isNearer': [3, '#F4C86A'],
            'isNearest': [4, '#FF9933'],
        }
        if (pictureState !== previousPictureState) {
            previousPictureState = pictureState
            if (!isSteakInMouth) {
                observingImages[pictureStates[pictureState][0]].classList.remove('hidden')
                observingImages[pictureStates[pictureState][0]].classList.remove('scale')
                observingImages[pictureStates[pictureState][0]].classList.add('active')
                for (let i = 0; i < observingImages.length; i++) {
                    if (i !== pictureStates[pictureState][0]) {
                        observingImages[i].classList.remove('scale')
                        observingImages[i].classList.remove('active')
                        observingImages[i].classList.add('hidden')
                    }
                }
                document.body.style.transition = 'background-color 0.5s ease'
                document.body.style.backgroundColor = pictureStates[pictureState][1]
            }
            else {
                const isMouthClosed = false;
                joseEatingSteak(isMouthClosed)
                for (let i = 0; i < observingImages.length; i++) {
                    observingImages[i].classList.add('scale')
                    observingImages[i].classList.remove('active')
                    observingImages[i].classList.remove('hidden')
                }
            }
        }
    }

    function joseEatingSteak(_isMouthClosed) {
        const eatingImages = document.querySelectorAll("#joseContainer .eating")
        console.log(eatingImages)
        let isMouthClosed = _isMouthClosed
        steak.removeEventListener('mousedown', setupMouseEvents.mouseDown)
        steak.removeEventListener('touchstart', setupMobileEvents.mobileDown)
        document.removeEventListener('mousemove', setupMouseEvents.mouseMove)
        document.removeEventListener('mouseup', setupMouseEvents.mouseUp)
        document.removeEventListener('touchmove', setupMobileEvents.mobileMove)
        document.removeEventListener('touchend', setupMobileEvents.mobileUp)
        const mouthDimensions = joseMouth.getBoundingClientRect()
        steak.style.top = `${mouthDimensions.top - 25}px`
        steak.style.left = `${mouthDimensions.left + 15}px`
        setTimeout(() => {
            steak.style.display = 'none'
        }, 2000);
        setupAudio.pushFrequencies('isSteakInMouth')
        let timeLeft = 30;
        let eatingInterval;
        eatingInterval = setInterval(() => {
            isMouthClosed = !isMouthClosed;
            console.log(Number(isMouthClosed))
            eatingImages[Number(isMouthClosed)].classList.remove('hidden')
            eatingImages[Number(isMouthClosed)].classList.add('active')
            eatingImages[Number(!isMouthClosed)].classList.remove('active')
            eatingImages[Number(!isMouthClosed)].classList.add('hidden')
            document.body.style.backgroundColor = '#FF3300'

            if (--timeLeft === 0) {
                clearInterval(eatingInterval)
                eatingImages[Number(isMouthClosed)].classList.remove('active')
                eatingImages[Number(isMouthClosed)].classList.add('hidden')
                eatingImages[Number(!isMouthClosed)].classList.remove('active')
                eatingImages[Number(!isMouthClosed)].classList.add('hidden')
                eatingInterval = null
                bringBackSteak()
                setupAudio.rampDownOscillators()
            }
        }, 100)
    }

    function bringBackSteak() {
        steak.style.opacity = 0; // Start fully transparent
        steak.style.display = 'block'; // Make the steak visible
        let opacity = 0;

        steak.addEventListener('mousedown', setupMouseEvents.mouseDown)
        steak.addEventListener('touchstart', setupMobileEvents.mobileDown)
        setupMouseEvents.mouseUp()
        setupMobileEvents.mobileUp()


        const revealInterval = setInterval(() => {
            opacity += 0.1; // Increment opacity
            steak.style.opacity = opacity; // Apply new opacity

            if (opacity >= 1) { // Stop when fully opaque
                clearInterval(revealInterval);
            }
        }, 10); // Adjusted timing for smooth animation
    }
    return {
        joseObservingSteak,
        joseEatingSteak,
        bringBackSteak,
    }
})()

const setupAudio = (() => {
    let isPlaying = false;
    let previousDistanceState = null;
    let activeOscillators = [];
    // Create an audio context
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Create a master GainNode to control overall volume
    const masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);

    function pushFrequencies(distanceState) {
        const notes = {
            c4: 261.63,
            e4: 329.63,
            g4: 392.00,
            c5: 523.25,
            e5: 659.26,
        };
        if (distanceState !== previousDistanceState) {
            // Stop any currently playing oscillators
            rampDownOscillators();

            previousDistanceState = distanceState;

            if (distanceState === 'isIdle') {
                playFrequencies([0]);
            } else if (distanceState === 'isSeen') {
                playFrequencies([notes.c4,]);
            } else if (distanceState === 'isNear') {
                playFrequencies([notes.c4, notes.e4]);
            } else if (distanceState === 'isNearer') {
                playFrequencies([notes.e4, notes.g4]);
            } else if (distanceState === 'isNearest') {
                playFrequencies([notes.g4, notes.c5]);
            } else if (distanceState === 'isSteakInMouth') {
                playFrequencies([notes.e4, notes.g4, notes.c5, notes.e5]);
            }
        }
    }

    function playFrequencies(frequencies) {
        if (isPlaying) return;
        isPlaying = true;

        masterGain.gain.setValueAtTime(0.0, audioCtx.currentTime); // Start with zero gain
        masterGain.gain.setTargetAtTime(0.1, audioCtx.currentTime, 0.2); // Ramp up to desired gain

        // Create a ChannelMergerNode
        const channelMerger = audioCtx.createChannelMerger(frequencies.length);
        channelMerger.connect(masterGain);

        // Create oscillators and connect them to the channel merger
        activeOscillators = frequencies.map((freq, index) => {
            const oscillator = audioCtx.createOscillator();
            oscillator.type = 'sine'; // Use sine wave
            oscillator.frequency.setValueAtTime(0, audioCtx.currentTime); // Start frequency at 0
            oscillator.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.1); // Ramp up to target frequency
            oscillator.connect(channelMerger, 0, index); // Connect to the specific channel of the merger
            return oscillator;
        });

        // Start all oscillators
        activeOscillators.forEach((oscillator) => oscillator.start());

    }
    function rampDownOscillators() {
        masterGain.gain.setTargetAtTime(0.01, audioCtx.currentTime, 0.2);
        //masterGain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 1);
        stopOscillators();
    }
    function stopOscillators() {
        if (activeOscillators.length > 0) {
            activeOscillators.forEach((oscillator) => {
                oscillator.stop();
                oscillator.disconnect();
            });
            activeOscillators = [];
        }
        isPlaying = false;
    }

    return {
        pushFrequencies,
        playFrequencies,
        rampDownOscillators,
    };
})();

const distanceHandlers = (() => {
    function handleSteakAndJoseDistance(_steakDimensions, _joseDimensions, _mouthDimensions) {
        const steakDimensions = _steakDimensions
        const joseDimensions = _joseDimensions
        const mouthDimensions = _mouthDimensions
        //Check dimensions of jose and steak img
        const distanceSteakAndJose = Math.sqrt(
            //X coords of jose and steak center
            Math.pow((joseDimensions.left + joseDimensions.width / 2) - (steakDimensions.left + steakDimensions.width / 2), 2) +
            //Y coords of jose and steak center
            Math.pow((joseDimensions.top + joseDimensions.height / 2) - (steakDimensions.top + steakDimensions.height / 2), 2)
        )
        const isSeen = distanceSteakAndJose <= 540 && distanceSteakAndJose > 400;
        const isNear = distanceSteakAndJose <= 400 && distanceSteakAndJose > 300;
        const isNearer = distanceSteakAndJose <= 300 && distanceSteakAndJose > 200;
        const isNearest = distanceSteakAndJose <= 200;
        const isSteakInMouth = (
            steakDimensions.left < mouthDimensions.right &&
            steakDimensions.right > mouthDimensions.left &&
            steakDimensions.top < mouthDimensions.bottom &&
            steakDimensions.bottom > mouthDimensions.top
        )

        if (isSeen) { setupJoseImages.joseObservingSteak('isSeen', isSteakInMouth), setupAudio.pushFrequencies('isSeen') }
        else if (isNear) { setupJoseImages.joseObservingSteak('isNear', isSteakInMouth), setupAudio.pushFrequencies('isNear') }
        else if (isNearer) { setupJoseImages.joseObservingSteak('isNearer', isSteakInMouth), setupAudio.pushFrequencies('isNearer') }
        else if (isNearest) {
            setupJoseImages.joseObservingSteak('isNearest', isSteakInMouth), setupAudio.pushFrequencies('isNearest')
            checkSteakInMouth(isSteakInMouth)
        }
        else if (!isSeen && !isNear && !isNearer && !isNearest) { setupJoseImages.joseObservingSteak('idle', isSteakInMouth), setupAudio.pushFrequencies('isIdle') }
    }
    function checkSteakInMouth(isSteakInMouth) {
        if (isSteakInMouth) { setupJoseImages.joseObservingSteak('eat1', isSteakInMouth) }
    }
    return {
        handleSteakAndJoseDistance,
        checkSteakInMouth,
    }
})()

const setupMouseEvents = (() => {
    function mouseMove(event) {
        //Record New X and Y positions
        newX = startX - event.clientX
        newY = startY - event.clientY
        startX = event.clientX
        startY = event.clientY
        //Position steak to new coordinates
        steak.style.top = `${steak.offsetTop - newY}px`
        steak.style.left = `${steak.offsetLeft - newX}px`
        //Record steak, Jose, and mouth dimensions
        const steakDimensions = steak.getBoundingClientRect()
        const joseDimensions = josePics.getBoundingClientRect()
        const mouthDimensions = joseMouth.getBoundingClientRect()
        //Fire handleSteakAndJoseDistance
        distanceHandlers.handleSteakAndJoseDistance(steakDimensions, joseDimensions, mouthDimensions);
    }
    function mouseDown(event) {
        //Record the initial position of steak
        startX = event.clientX
        startY = event.clientY
        //Remove transition to avoid slow dragging
        steak.style.transition = ''
        //While mouse down, browser should listen to mousemove and mouseup events
        document.addEventListener('mousemove', mouseMove)
        document.addEventListener('mouseup', mouseUp)
    }
    function mouseUp(event) {
        //Add transition to go back to initial position
        steak.style.transition = 'top 2s, left 2s'
        steak.style.top = resetY
        steak.style.left = resetX
        //Reset jose image to idle
        setupJoseImages.joseObservingSteak('idle');
        //Stop oscillators
        setupAudio.rampDownOscillators()
        //Remove event listener to ensure that it doesn't move when steak is not pressed
        document.removeEventListener('mousemove', mouseMove)
    }
    return {
        mouseMove,
        mouseDown,
        mouseUp,
    }
})()

const setupMobileEvents = (() => {
    function mobileMove(event) {
        //Record New X and Y positions
        event.preventDefault();
        newX = startX - event.touches[0].clientX;
        newY = startY - event.touches[0].clientY;
        startX = event.touches[0].clientX;
        startY = event.touches[0].clientY;
        //Position steak to new coordinates
        steak.style.top = `${steak.offsetTop - newY}px`
        steak.style.left = `${steak.offsetLeft - newX}px`
        //Record steak, Jose, and mouth dimensions
        const steakDimensions = steak.getBoundingClientRect()
        const joseDimensions = josePics.getBoundingClientRect()
        const mouthDimensions = joseMouth.getBoundingClientRect()
        //Fire handleSteakAndJoseDistance
        distanceHandlers.handleSteakAndJoseDistance(steakDimensions, joseDimensions, mouthDimensions);
    }
    function mobileDown(event) {
        //Record the initial position of steak
        event.preventDefault();
        startX = event.touches[0].clientX; // Use `touches` for touch events
        startY = event.touches[0].clientY;
        //Remove transition to avoid slow dragging
        steak.style.transition = ''
        //While mouse down, browser should listen to mousemove and mouseup events
        document.addEventListener('touchmove', mobileMove);
        document.addEventListener('touchend', mobileUp);
    }
    function mobileUp(event) {
        //Add transition to go back to initial position
        steak.style.transition = 'top 2s, left 2s'
        steak.style.top = resetY
        steak.style.left = resetX
        //Reset jose image to idle
        setupJoseImages.joseObservingSteak('idle');
        //Stop oscillators
        setupAudio.rampDownOscillators()
        //Remove event listener to ensure that it doesn't move when steak is not pressed
        document.removeEventListener('touchmove', mobileMove)
    }
    return {
        mobileMove,
        mobileDown,
        mobileUp,
    }
})()

setupJoseImages.joseObservingSteak('idle') //Set jose image to idle
steak.addEventListener('dragstart', (event) => event.preventDefault()) // Prevent steak image from ghost dragged
steak.addEventListener('mousedown', setupMouseEvents.mouseDown)
steak.addEventListener('touchstart', setupMobileEvents.mobileDown);

window.addEventListener('resize', () => {
    resetX = `${(window.innerWidth / 2) - (steak.getBoundingClientRect().width / 2)}px`
    resetY = '15%'
    setupMouseEvents.mouseUp
    setupMobileEvents.mobileUp
})