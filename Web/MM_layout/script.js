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

// PORTFOLIO csat
const images = [
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200',
    'https://images.unsplash.com/photo-1615529328331-f8917597711f?w=1200',
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200',
    'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1200',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200'
];

let currentImageIndex = 0;

function openGallery(index) {
    currentImageIndex = index;
    document.getElementById('projGalleryModal').classList.add('active');
    updateGalleryImage();
    createThumbnails();
}

function closeGallery() {
    document.getElementById('projGalleryModal').classList.remove('active');
}

function changeImage(direction) {
    currentImageIndex += direction;
    if (currentImageIndex < 0) {
        currentImageIndex = images.length - 1;
    } else if (currentImageIndex >= images.length) {
        currentImageIndex = 0;
    }
    updateGalleryImage();
}

function updateGalleryImage() {
    document.getElementById('galleryImage').src = images[currentImageIndex];
    document.getElementById('imageCounter').textContent = `${currentImageIndex + 1} / ${images.length}`;
    updateThumbnails();
}

function createThumbnails() {
    const strip = document.getElementById('thumbnailStrip');
    strip.innerHTML = '';
    images.forEach((img, index) => {
        const thumb = document.createElement('img');
        thumb.src = img;
        thumb.className = 'thumbnail';
        if (index === currentImageIndex) {
            thumb.classList.add('active');
        }
        thumb.onclick = () => {
            currentImageIndex = index;
            updateGalleryImage();
        };
        strip.appendChild(thumb);
    });
}

function updateThumbnails() {
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach((thumb, index) => {
        if (index === currentImageIndex) {
               thumb.classList.add('active');
           } else {
            thumb.classList.remove('active');
        }
    });
}

// Klávesové skratky
document.addEventListener('keydown', (e) => {
        if (document.getElementById('projGalleryModal').classList.contains('active')) {
        if (e.key === 'ArrowLeft') changeImage(-1);
        if (e.key === 'ArrowRight') changeImage(1);
        if (e.key === 'Escape') closeGallery();
    }
});