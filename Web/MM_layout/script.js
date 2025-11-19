// GALERIA
const galleryTrack = document.getElementById('Glist');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const indicatorsContainer = document.getElementById('indicators');
const galleryWrapper = document.getElementById('Gprojects');

let currentPosition = 0;
const itemWidth = 280 + 20; // sirka polozky + gap
const visibleItems = Math.floor(galleryWrapper.offsetWidth / itemWidth);
const totalItems = document.querySelectorAll('.galleryItem').length;
const maxPosition = Math.max(0, totalItems - visibleItems);


// aktualizacia pozicie
function updatePosition() {
    const offset = -currentPosition * itemWidth;
    galleryTrack.style.transform = `translateX(${offset}px)`;
    updateButtons();
    updateIndicators();
}

// aktualizacia tlacidiel
function updateButtons() {
    prevBtn.classList.toggle('disabled', currentPosition === 0);
    nextBtn.classList.toggle('disabled', currentPosition >= maxPosition);
}

// dopredu
function scrollNext() {
    if (currentPosition < maxPosition) {
        currentPosition = Math.min(currentPosition + visibleItems, maxPosition);
        updatePosition();
    }
}

// dozadu
function scrollPrev() {
    if (currentPosition > 0) {
        currentPosition = Math.max(currentPosition - visibleItems, 0);
        updatePosition();
    }
}

// na konkretny slide
function goToSlide(slideIndex) {
    currentPosition = Math.min(slideIndex * visibleItems, maxPosition);
    updatePosition();
}

nextBtn.addEventListener('click', scrollNext);
prevBtn.addEventListener('click', scrollPrev);

// touch/swipe na mobiloch
let touchStartX = 0;
let touchEndX = 0;

galleryWrapper.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
});

galleryWrapper.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    if (touchEndX < touchStartX - 50) scrollNext();
    if (touchEndX > touchStartX + 50) scrollPrev();
}

// responzivne prisposobenie pri zmene velkosti okna
window.addEventListener('resize', () => {
    const newVisibleItems = Math.floor(galleryWrapper.offsetWidth / itemWidth);
    if (newVisibleItems !== visibleItems) {
        location.reload(); // reload pre prepocet
    }
});


//resp menu
function toggleMenu() {
    const navMenu = document.getElementById('navMenu');
    const hamburger = document.querySelector('.hamburger');
    navMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
}

// zavrie menu 
document.querySelectorAll('.NavMenu a').forEach(link => {
    link.addEventListener('click', () => {
        document.getElementById('navMenu').classList.remove('active');
        document.querySelector('.hamburger').classList.remove('active');
    });
});
