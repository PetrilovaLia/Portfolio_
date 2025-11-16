document.addEventListener('DOMContentLoaded', function(){
    const dino = document.querySelector('.dino')
    const grid = document.querySelector('.grid')
    const alert = document.getElementById('alert')
    let gravity = 0.81
    let isjumping = false
    let isGameOver = false

    function control(e){
        if (e.code === "Space"){
            // console.log('jump')
            if(!isjumping){
                jump()
            }
        }
    }

    document.addEventListener('keydown', control)

    let positon = 0
    function jump(){
        isjumping = true
        let count = 0
        let timerId = setInterval(function() {
            // dole
            if (count === 15){
                clearInterval(timerId)
                let downTimerId = setInterval(function(){
                    if (count === 0){
                        clearInterval(downTimerId)
                        isjumping = false
                    }
                    // console.log('funguje')
                    positon += 7
                    count--
                    positon = positon * gravity
                    dino.style.bottom = positon + 'px'
                }, 20)
            }
            // hore
            positon += 30
            count++
            positon = positon * gravity
            dino.style.bottom = positon + 'px'
        }, 20)
    }

    function generetePrekazky(){
        if(!isGameOver){
            let randomTime = Math.random() * 4000
            let prekazkyPosition = 1000
            const prekazky = document.createElement('div')
            prekazky.classList.add('prekazky')
            grid.appendChild(prekazky)
            prekazky.style.left = prekazkyPosition + 'px'

            let timerId = setInterval(function(){
                if (prekazkyPosition > 0 && prekazkyPosition < 60 && positon < 60){
                    clearInterval(timerId)
                    alert.innerHTML = 'Game Over'
                    isGameOver = true
                    //
                    while (grid.firstChild){
                        grid.removeChild(grid.lastChild)
                    }
                }
                prekazkyPosition -= 10
                prekazky.style.left = prekazkyPosition + 'px'
            }, 20)
            setTimeout(generetePrekazky, randomTime)
            // if(!isGameOver) setTimeout(generetePrekazky, randomTime)
        }
        
    }

    
    generetePrekazky()

    
})