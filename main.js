// TODO work on making more "random" the sleep time

function randomFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}


class Sticazzo {
  constructor(el) {
    // BIND THAT SHIT
    this.runTimeline = this.runTimeline.bind(this)

    this.widthLimits = [20, 80]
    this.heightLimits = [20, 80]

    this.el = el

    this.runTimeline()
  }

  // first we set the random position
  // than we wait some time
  // then we do the animation
  // and then we do it all again until the user doesn't understand the meaning of STICAZZI!
  async runTimeline() {
    this.resetVideo(this.el)
    this.x = randomFromInterval(...this.widthLimits)
    this.y = randomFromInterval(...this.heightLimits)

    await sleep(randomFromInterval(0, 6000))

    await this.playVideo(this.el)
    this.animate(this.el)
      .finished.then(this.runTimeline)
  }

  animate(el) {
    const initialScale = 0.8
    const middleScale = 1
    const finalScale = 1.2

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
  document.querySelectorAll('video').forEach((el) => {
    new Sticazzo(el)
  })
})
