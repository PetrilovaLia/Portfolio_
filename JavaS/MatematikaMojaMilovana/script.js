const screenDisplay = document.querySelector('.obrazovka')
const buttons = document.querySelectorAll('button')
console.log(buttons)

let calculation = []
let accumulativeCalculation

function calculate(button){
    // console.log('clicked', button.textContent)
    const value = button.textContent
    if(value === 'CLEAR'){
        calculation = []
        screenDisplay.textContent = '.'
    } else if (value === "="){
        console.log(accumulativeCalculation)
        screenDisplay.textContent = eval(accumulativeCalculation)
    } else {
        calculation.push(value)
        accumulativeCalculation = calculation.join('')
        screenDisplay.textContent = accumulativeCalculation
    }
   
    
}

buttons.forEach(button => button.addEventListener('click', () => calculate(button)))