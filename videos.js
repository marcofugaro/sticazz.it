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
  await video.play()
  video.pause()
  video.currentTime = 0
}

async function supportsAutoplay(testVideo) {
  await loadVideo(testVideo)
  try {
    await playAndPause(testVideo)
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
    console.error('MA CHE CAZZO FAI?? NUN CE SO VIDEO CARICHI')
    return false
  }

  return window.videoQueue.shift()
}


class Sticazzo {
  constructor(el, options) {
    this.options = options
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

    // console.time('playing time')
    await this.el.play()
    // console.timeEnd('playing time')

    await this.animate(this.el).finished
    this.stopVideo(this.el)

    await sleep(this.timeToWait)
    this.runTimeline()
  }

  animate(el) {
    const { isDesktop } = this.options
    const initialScale = isDesktop ? 0.8 : 1
    const middleScale = isDesktop ? 1 : 1
    const finalScale = isDesktop ? middleScale + el.duration * 0.06 : 1

    const growOutDuration = isDesktop ? 100 : 300

    const translation = `calc(-50% + ${this.x}vw), calc(-50% + ${this.y}vh)`

    const timeline = new SequenceEffect([
      new KeyframeEffect(el, [
        { offset: 0, transform: `translate(${translation}) scale(${initialScale})`, opacity: 0 },
        { offset: 0.5, opacity: 1 },
        { offset: 1, transform: `translate(${translation}) scale(${middleScale})`, opacity: 1 },
      ], {
        duration: growOutDuration,
        easing: 'ease-out',
        iterations: 1,
        fill: 'forwards',
      }),

      new KeyframeEffect(el, [
        { offset: 0, transform: `translate(${translation}) scale(${middleScale})`, opacity: 1 },
        { offset: 0.9, opacity: 1 },
        { offset: 1, transform: `translate(${translation}) scale(${finalScale})`, opacity: 0 },
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

  const sticazziBtn = document.querySelector('.sticazzibtn')
  const sticazzintainer = document.querySelector('.sticazzintainer')

  if (isDesktop) {
    sticazzintainer.classList.remove('opaque')

    // wait for the first video to load and then start playing
    await Promise.race(
      sticazziVideos.map(async (video) => {
        // the testVideo will be the first to be added to the queue
        await loadVideo(video)
        addToQueue(video)
      })
    )

    Object.keys(sticazziVideos).forEach(async (i) => {
      const initialTimeToWait = i * window.sticazzInterval
      await sleep(initialTimeToWait)

      const video = retrieveFromQueue() || await pEvent(window, 'queueadded') && retrieveFromQueue()
      new Sticazzo(video, { isDesktop })
    })
  } else {
    sticazziBtn.classList.remove('hidden')
    await sleep(10)
    sticazziBtn.classList.remove('opaque')

    // load the videos first, then wait for the user to click and play them
    await Promise.all(sticazziVideos.map((video) => loadVideo(video)))
    await pEvent(sticazziBtn, 'click')

    // wait 200ms for the button animation to take effect
    await sleep(200)

    sticazziBtn.classList.add('hidden')
    sticazzintainer.classList.remove('opaque')

    sticazziVideos.forEach(async (video, i) => {
      const initialTimeToWait = i * window.sticazzInterval

      await playAndPause(video)
      await sleep(initialTimeToWait)
      new Sticazzo(video, { isDesktop })
    })
  }
}

init()
