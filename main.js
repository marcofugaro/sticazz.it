// TODO work on making more "random" the sleep time

function randomFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
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
    this.resetVideo(this.el)
    this.x = this.isSuper ? 50 : randomFromInterval(...this.widthLimits)
    this.y = this.isSuper ? 50 : randomFromInterval(...this.heightLimits)
    this.el.style.zIndex = ++window.sticazzIndex

    await this.playVideo(this.el)
    await this.animate(this.el).finished
    await sleep(this.timeToWait)
    this.runTimeline()
  }

  animate(el) {
    const initialScale = 0.9
    const middleScale = 1
    const finalScale = middleScale + el.duration * 0.06

    const growOutDuration = 200

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

  // not always when you play() a video it starts playing
  playVideo(video) {
    return new Promise((resolve) => {
      video.addEventListener('playing', () => {
        video.currentTime = 0
        resolve()
      }, { once: true })

      video.play()
    })
  }

  resetVideo(video) {
    video.pause()
    video.currentTime = 0
  }
}


window.addEventListener('load', () => {
  const sticazziVideos = [...document.querySelectorAll('video')]
  window.sticazzIndex = 0
  window.sticazziLength = sticazziVideos.length
  window.sticazzInterval = 800 // the time between each video popping out
  window.superSticazzoPause = 1000 // how much time the superSticazzo stays in place

  sticazziVideos.forEach(async (el, i) => {
    const initialTimeToWait = i * window.sticazzInterval
    await sleep(initialTimeToWait)
    new Sticazzo(el)
  })
})
