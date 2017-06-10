function randomFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function pEvent(emitter, event) {
  return new Promise((resolve) => emitter.addEventListener(event, resolve))
}

function supportsAutoplay() {
  return new Promise((resolve) => {
    const el = document.createElement('video')
    const src = 'data:video/mp4;base64,AAAAFGZ0eXBNU05WAAACAE1TTlYAAAOUbW9vdgAAAGxtdmhkAAAAAM9ghv7PYIb+AAACWAAACu8AAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAnh0cmFrAAAAXHRraGQAAAAHz2CG/s9ghv4AAAABAAAAAAAACu8AAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAFAAAAA4AAAAAAHgbWRpYQAAACBtZGhkAAAAAM9ghv7PYIb+AAALuAAANq8AAAAAAAAAIWhkbHIAAAAAbWhscnZpZGVBVlMgAAAAAAABAB4AAAABl21pbmYAAAAUdm1oZAAAAAAAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAVdzdGJsAAAAp3N0c2QAAAAAAAAAAQAAAJdhdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAFAAOABIAAAASAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGP//AAAAEmNvbHJuY2xjAAEAAQABAAAAL2F2Y0MBTUAz/+EAGGdNQDOadCk/LgIgAAADACAAAAMA0eMGVAEABGjuPIAAAAAYc3R0cwAAAAAAAAABAAAADgAAA+gAAAAUc3RzcwAAAAAAAAABAAAAAQAAABxzdHNjAAAAAAAAAAEAAAABAAAADgAAAAEAAABMc3RzegAAAAAAAAAAAAAADgAAAE8AAAAOAAAADQAAAA0AAAANAAAADQAAAA0AAAANAAAADQAAAA0AAAANAAAADQAAAA4AAAAOAAAAFHN0Y28AAAAAAAAAAQAAA7AAAAA0dXVpZFVTTVQh0k/Ou4hpXPrJx0AAAAAcTVREVAABABIAAAAKVcQAAAAAAAEAAAAAAAAAqHV1aWRVU01UIdJPzruIaVz6ycdAAAAAkE1URFQABAAMAAAAC1XEAAACHAAeAAAABBXHAAEAQQBWAFMAIABNAGUAZABpAGEAAAAqAAAAASoOAAEAZABlAHQAZQBjAHQAXwBhAHUAdABvAHAAbABhAHkAAAAyAAAAA1XEAAEAMgAwADAANQBtAGUALwAwADcALwAwADYAMAA2ACAAMwA6ADUAOgAwAAABA21kYXQAAAAYZ01AM5p0KT8uAiAAAAMAIAAAAwDR4wZUAAAABGjuPIAAAAAnZYiAIAAR//eBLT+oL1eA2Nlb/edvwWZflzEVLlhlXtJvSAEGRA3ZAAAACkGaAQCyJ/8AFBAAAAAJQZoCATP/AOmBAAAACUGaAwGz/wDpgAAAAAlBmgQCM/8A6YEAAAAJQZoFArP/AOmBAAAACUGaBgMz/wDpgQAAAAlBmgcDs/8A6YEAAAAJQZoIBDP/AOmAAAAACUGaCQSz/wDpgAAAAAlBmgoFM/8A6YEAAAAJQZoLBbP/AOmAAAAACkGaDAYyJ/8AFBAAAAAKQZoNBrIv/4cMeQ=='
    el.setAttribute('src', src)
    el.play()
      .then(() => resolve(true))
      .catch(() => resolve(false))
  })
}

// no error handling? E STICAZZI?!?
function loadVideo(el) {
  return new Promise((resolve) => {
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
    await this.animate(this.el).finished
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
        { offset: 0, transform: `translate(${translation}) scale(${initialScale})`, opacity: 0 },
        { offset: 0.1, opacity: 1 },
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
async function init() {
  const sticazziVideos = [...document.querySelectorAll('video')]
  window.sticazzIndex = 0
  window.sticazziLength = sticazziVideos.length
  window.sticazzInterval = 800 // the time between each video popping out
  window.superSticazzoPause = 1000 // how much time the superSticazzo stays in place
  window.videoQueue = []

  if (await supportsAutoplay()) {
    window.addEventListener('queueadded', startVideoPlaying, { once: true })
  } else {
    const sticazziBtn = document.querySelector('.sticazzibtn')
    sticazziBtn.addEventListener('click', startVideoPlaying)
  }

  sticazziVideos.forEach(async (el, i) => {
    await loadVideo(el)
    addToQueue(el)
  })

  function startVideoPlaying() {
    sticazziVideos.forEach(async (el, i) => {
      const initialTimeToWait = i * window.sticazzInterval
      await sleep(initialTimeToWait)

      // TODO do some tests and tell if it's needed to  substract the time from next round
      const video = retrieveFromQueue() || await pEvent(window, 'queueadded') && retrieveFromQueue()
      new Sticazzo(video)
    })
  }
}

init()

window.addEventListener('queueadded', () => {
  console.log('queueadded', window.videoQueue)
})
