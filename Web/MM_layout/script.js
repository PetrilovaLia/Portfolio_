// Hamburger menu funkcionalita
    document.addEventListener('DOMContentLoaded', function() {
        // Vytvor hamburger tlačidlo
        const navbar = document.querySelector('.navbar');
        const navLinks = document.querySelector('.nav-links');
        
        // Vlož hamburger po logo
        const hamburger = document.createElement('div');
        hamburger.className = 'hamburger';
        hamburger.innerHTML = '<span></span><span></span><span></span>';
        
        navbar.insertBefore(hamburger, navLinks);
        
        // Toggle menu pri kliknutí
        hamburger.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            
            // Animácia hamburger ikony
            const spans = hamburger.querySelectorAll('span');
            if (navLinks.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(7px, 7px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(7px, -7px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
        
        // Zatvor menu po kliknutí na odkaz
        const links = navLinks.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', function() {
                navLinks.classList.remove('active');
                const spans = hamburger.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            });
        });
    });


// GALERIA
        const galleryTrack = document.getElementById('Glist');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const indicatorsContainer = document.getElementById('indicators');
        const galleryWrapper = document.getElementById('Gprojects');

        let currentPosition = 0;
        const itemWidth = 280 + 20; // šírka položky + gap
        const visibleItems = Math.floor(galleryWrapper.offsetWidth / itemWidth);
        const totalItems = document.querySelectorAll('.galleryItem').length;
        const maxPosition = Math.max(0, totalItems - visibleItems);

        // Vytvorenie indikátorov
        function createIndicators() {
            const numberOfIndicators = Math.ceil(totalItems / visibleItems);
            for (let i = 0; i < numberOfIndicators; i++) {
                const indicator = document.createElement('div');
                indicator.classList.add('indicator');
                if (i === 0) indicator.classList.add('active');
                indicator.addEventListener('click', () => goToSlide(i));
                indicatorsContainer.appendChild(indicator);
            }
        }

        // Aktualizácia pozície
        function updatePosition() {
            const offset = -currentPosition * itemWidth;
            galleryTrack.style.transform = `translateX(${offset}px)`;
            updateButtons();
            updateIndicators();
        }

        // Aktualizácia tlačidiel
        function updateButtons() {
            prevBtn.classList.toggle('disabled', currentPosition === 0);
            nextBtn.classList.toggle('disabled', currentPosition >= maxPosition);
        }

        // Aktualizácia indikátorov
        function updateIndicators() {
            const indicators = document.querySelectorAll('.indicator');
            const activeIndex = Math.floor(currentPosition / visibleItems);
            indicators.forEach((indicator, index) => {
                indicator.classList.toggle('active', index === activeIndex);
            });
        }

        // Posun dopredu
        function scrollNext() {
            if (currentPosition < maxPosition) {
                currentPosition = Math.min(currentPosition + visibleItems, maxPosition);
                updatePosition();
            }
        }

        // Posun dozadu
        function scrollPrev() {
            if (currentPosition > 0) {
                currentPosition = Math.max(currentPosition - visibleItems, 0);
                updatePosition();
            }
        }

        // Skok na konkrétny slide
        function goToSlide(slideIndex) {
            currentPosition = Math.min(slideIndex * visibleItems, maxPosition);
            updatePosition();
        }

        // Event listenery
        nextBtn.addEventListener('click', scrollNext);
        prevBtn.addEventListener('click', scrollPrev);

        // Podpora pre klávesnicu
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') scrollPrev();
            if (e.key === 'ArrowRight') scrollNext();
        });

        // Podpora pre touch/swipe na mobilných zariadeniach
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

        // Responzívne prispôsobenie pri zmene veľkosti okna
        window.addEventListener('resize', () => {
            const newVisibleItems = Math.floor(galleryWrapper.offsetWidth / itemWidth);
            if (newVisibleItems !== visibleItems) {
                location.reload(); // Jednoduchý reload pre prepočet
            }
        });

        // Inicializácia
        createIndicators();
        updateButtons();

        // Pridanie click event pre obrázky
        const galleryImages = document.querySelectorAll('.galleryImg');
        galleryImages.forEach(image => {
            image.addEventListener('click', function(e) {
                // Zabránime navigácii ak používateľ práve scrolluje
                if (Math.abs(touchEndX - touchStartX) > 50) {
                    return;
                }
               
                const url = this.getAttribute('data-url');
                if (url) {
                    window.location.href = url;
                }
            });
        });

        // Voliteľné: automatické scrollovanie
        let autoScrollInterval;
       
        function startAutoScroll() {
            autoScrollInterval = setInterval(() => {
                if (currentPosition >= maxPosition) {
                    currentPosition = 0;
                } else {
                    scrollNext();
                }
            }, 5000); // každých 5 sekúnd
        }

        function stopAutoScroll() {
            clearInterval(autoScrollInterval);
        }

        // Spustenie auto-scrollu (odkomentujte ak chcete)
        // startAutoScroll();

        // Zastavenie auto-scrollu pri interakcii
        galleryWrapper.addEventListener('mouseenter', stopAutoScroll);
        prevBtn.addEventListener('click', stopAutoScroll);
        nextBtn.addEventListener('click', stopAutoScroll);