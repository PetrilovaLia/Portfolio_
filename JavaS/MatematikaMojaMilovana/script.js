const screenDisplay = document.querySelector('.obrazovka')
const buttons = document.querySelectorAll('button')
console.log(buttons)

let calculation = []

function calculate(button){
    console.log('clicked', button.textContent)
    const value = button.textContent
    calculation.push(value)
    console.log(calculation)
}

buttons.forEach(button => button.addEventListener('click', () => calculate(button)))