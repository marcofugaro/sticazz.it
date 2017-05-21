const stiCazziContainer = document.querySelector('.sticazzintainer')
const stiTantiCazzi = document.querySelector('.stitanticazzi')
const { offsetHeight: marqueeHeight } = stiTantiCazzi
const { paddingTop: padding } = window.getComputedStyle(stiCazziContainer)

const timesToDUplicate = Math.floor((window.innerHeight - parseFloat(padding) * 2) / marqueeHeight)

const duplicatesArr = Array(timesToDUplicate - 1).fill().map(() => stiTantiCazzi.cloneNode(true))
duplicatesArr.forEach((el, i) => (!(i % 2) && el.setAttribute('direction', 'right')))

duplicatesArr.forEach((el) => stiCazziContainer.appendChild(el))
