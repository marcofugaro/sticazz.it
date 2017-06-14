function randomFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function pEvent(emitter, event) {
  return new Promise((resolve) => emitter.addEventListener(event, resolve))
}

async function playAndPause(video) {
  video.muted = true
  await video.play()
  video.pause()
  video.currentTime = 0
  video.muted = false
}

async function supportsAutoplay(testVideo) {
  await loadVideo(testVideo)
  try {
    // await playAndPause(testVideo)
    await testVideo.play()
    testVideo.pause()
    testVideo.currentTime = 0
    return true
  } catch (e) {
    return false
  }
}

// no error handling? E STICAZZI?!?
function loadVideo(el) {
  return new Promise((resolve) => {
    // if the video already loaded, resolve
    if (el.readyState > 0) {
      return resolve()
    }

    fetch(el.getAttribute('data-src'))
      .then((response) => response.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob)
        el.setAttribute('src', url)
        return pEvent(el, 'loadedmetadata')
      })
      .then(resolve)
  })
}

function addToQueue(el) {
  const lastElement = window.videoQueue[window.videoQueue.length - 1]
  // keep the supersticazzo last
  if (lastElement && lastElement.classList.contains('supersticazzo')) {
    window.videoQueue.splice(-1, 0, el)
  } else {
    window.videoQueue.push(el)
  }

  window.dispatchEvent(new CustomEvent('queueadded'))
}

function retrieveFromQueue(el) {
  if (window.videoQueue.length === 0) {
    console.error('AJAJAJAJAJA')
    return false
  }

  console.warn('queueremoved', window.videoQueue)
  return window.videoQueue.shift()
}


class Sticazzo {
  constructor(el) {
    this.widthLimits = [20, 80]
    this.heightLimits = [20, 80]
    this.el = el
    this.isSuper = this.el.classList.contains('supersticazzo')
    this.timeToWait = window.sticazziLength * window.sticazzInterval - this.el.duration * 1000 + window.superSticazzoPause

    this.runTimeline()
  }

  // first we set the random position
  // then we put the video in front of the others
  // then we do the animation
  // than we wait some time
  // and then we do it all again until the user doesn't understand the meaning of STICAZZI!
  async runTimeline() {
    this.x = this.isSuper ? 50 : randomFromInterval(...this.widthLimits)
    this.y = this.isSuper ? 50 : randomFromInterval(...this.heightLimits)
    this.el.style.zIndex = ++window.sticazzIndex

    console.time('playing time')
    await this.el.play()
    console.timeEnd('playing time')
    this.el.classList.remove('hidden')
    await this.animate(this.el).finished
    this.el.classList.add('hidden')
    this.stopVideo(this.el)

    await sleep(this.timeToWait)
    this.runTimeline()
  }

  animate(el) {
    const initialScale = 0.9
    const middleScale = 1
    const finalScale = middleScale + el.duration * 0.06

    const growOutDuration = 100

    const translation = `calc(-50% + ${this.x}vw), calc(-50% + ${this.y}vh)`

    const timeline = new SequenceEffect([
      new KeyframeEffect(el, [
        { offset: 0, transform: `translate(${translation})`, opacity: 0 },
        { offset: 0.1, opacity: 1 },
        { offset: 1, transform: `translate(${translation})`, opacity: 1 },
      ], {
        duration: growOutDuration,
        easing: 'ease-out',
        iterations: 1,
        fill: 'forwards',
      }),

      new KeyframeEffect(el, [
        { offset: 0, transform: `translate(${translation})`, opacity: 1 },
        { offset: 0.9, opacity: 1 },
        { offset: 1, transform: `translate(${translation})`, opacity: 0 },
      ], {
        duration: (el.duration * 1000) - growOutDuration,
        easing: 'linear',
        iterations: 1,
        fill: 'forwards',
      }),
    ])

    const animation = new Animation(timeline, document.timeline)
    animation.play()
    return animation
  }

  stopVideo(video) {
    video.pause()
    video.currentTime = 0
  }
}


//
//  /$$$$$$ /$$   /$$ /$$$$$$ /$$$$$$$$
// |_  $$_/| $$$ | $$|_  $$_/|__  $$__/
//   | $$  | $$$$| $$  | $$     | $$
//   | $$  | $$ $$ $$  | $$     | $$
//   | $$  | $$  $$$$  | $$     | $$
//   | $$  | $$\  $$$  | $$     | $$
//  /$$$$$$| $$ \  $$ /$$$$$$   | $$
// |______/|__/  \__/|______/   |__/
//
// CHALLENGE: show the first video as soon as possible
//
async function init() {
  const sticazziVideos = [...document.querySelectorAll('video')]
  const isDesktop = await supportsAutoplay(sticazziVideos[0])
  window.sticazzIndex = 0
  window.sticazziLength = sticazziVideos.length
  window.sticazzInterval = 800 // the time between each video popping out
  window.superSticazzoPause = 1000 // how much time the superSticazzo stays in place
  window.videoQueue = []

  if (isDesktop) {
    window.addEventListener('queueadded', startVideoPlaying, { once: true })
    sticazziVideos.forEach(async (el, i) => {
      // the testVideo will be the first to be added to the queue
      await loadVideo(el)
      addToQueue(el)
    })
    // TODO use await & promise.race
  } else {
    const sticazziBtn = document.querySelector('.sticazzibtn')
    sticazziBtn.classList.remove('hidden')
    await Promise.all([
      Promise.all(sticazziVideos.map((el) => loadVideo(el))),
      pEvent(sticazziBtn, 'click')
    ])
    sticazziBtn.classList.add('hidden')
    startVideoPlayingMobile()
  }


  function startVideoPlaying() {
    Object.keys(sticazziVideos).forEach(async (i) => {
      const initialTimeToWait = i * window.sticazzInterval
      await sleep(initialTimeToWait)

      const video = retrieveFromQueue() || await pEvent(window, 'queueadded') && retrieveFromQueue()
      new Sticazzo(video)
    })
  }

  function startVideoPlayingMobile() {
    sticazziVideos.forEach(async (el, i) => {
      const initialTimeToWait = i * window.sticazzInterval

      const video = el
      await playAndPause(video)
      await sleep(initialTimeToWait)
      new Sticazzo(video)
    })
  }
}

init()

window.addEventListener('queueadded', () => {
  console.log('queueadded', window.videoQueue)
})
