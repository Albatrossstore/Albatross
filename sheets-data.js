document.addEventListener('DOMContentLoaded', () => {
    const SHEET_ID = '18oQzexSZ7ix_OA6ehLg_6L6yGkV8Zy6Mqiod0h2cLnA';
    const CATEGORIES_SHEET_NAME = 'Categories';
    const PRODUCTS_SHEET_NAME = 'Products';
    const CAROUSEL_SHEET_NAME = 'carousel';
    const HEADER_PRODUCTS_LIMIT = 6;

    const categoriesContainer = document.getElementById('categories-container');
    const productsContainer = document.getElementById('products-container');
    const carouselTrack = document.getElementById('hero-carousel-track');
    const carouselPrevButton = document.getElementById('carousel-prev');
    const carouselNextButton = document.getElementById('carousel-next');
    const carouselDots = document.getElementById('carousel-dots');
    const carouselViewport = document.querySelector('.hero-carousel-viewport');

    const normalizeLink = (url = '') => {
        if (!url) return '#';
        if (/^(https?:|mailto:|tel:|#)/i.test(url)) return url;
        if (url.startsWith('//')) return url;
        return url.replace(/^\/+/, '');
    };

    const fetchData = (sheetName, container, createHtmlFunction, onCompleteCallback) => {
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;

        fetch(url)
            .then(response => response.text())
            .then(text => {
                const jsonData = JSON.parse(text.substring(47).slice(0, -2));
                if (jsonData.status === 'error') {
                    throw new Error(jsonData.errors[0].detailed_message);
                }
                container.innerHTML = '';
                const rows = jsonData.table.rows;
                rows.forEach(row => {
                    if (row && row.c) {
                        const rowData = {
                            name:        row.c[1]?.v || '',
                            title:       row.c[1]?.v || '',
                            description: row.c[2]?.v || '',
                            imagePath:   sheetName === 'Categories' ? row.c[2]?.v : row.c[3]?.v,
                            link:        sheetName === 'Categories' ? row.c[3]?.v : row.c[4]?.v,
                            badge:       sheetName === 'Categories' ? null : row.c[5]?.v
                        };
                        container.innerHTML += createHtmlFunction(rowData);
                    }
                });

                if (onCompleteCallback) {
                    onCompleteCallback();
                }
            })
            .catch(error => {
                console.error(`Error fetching data for ${sheetName}:`, error);
                container.innerHTML = `<p style="color: #ff8a5c; font-size: 1.2rem;">Error: Could not load content. Please check the Google Sheet permissions.</p>`;
            });
    };

    const createCategoryHtml = (data) => `
        <div class="category-column">
            <a href="${normalizeLink(data.link)}" class="category-link">
                <div class="category-image-placeholder">
                    <img src="${data.imagePath}" alt="${data.name}">
                </div>
                <button class="category-button">${data.name}</button>
            </a>
        </div>
    `;

    const createProductHtml = (data) => {
        let badgeHtml = '';
        if (data.badge) {
            let badgeClass = 'product-badge';
             if (data.badge.includes('%') || data.badge.toLowerCase() === 'sale') {
                badgeClass += ' badge-discount';
            }
            if (data.badge.toLowerCase() === 'sold out') {
                badgeClass += ' badge-sold-out';
            }
            badgeHtml = `<div class="${badgeClass}">${data.badge}</div>`;
        }

        return `
            <div class="product-item">
                <a href="${normalizeLink(data.link)}" class="product-link product-image-link">
                    ${badgeHtml} 
                    <div class="product-image-placeholder">
                        <img src="${data.imagePath}" alt="${data.title}">
                    </div>
                </a>
                <a href="${normalizeLink(data.link)}" class="product-link">
                    <div class="product-info">
                        <h3 class="product-title">${data.title}</h3>
                        <p class="product-description">${data.description}</p>
                    </div>
                </a>
                <a href="${normalizeLink(data.link)}" class="get-it-button-link">
                    <button class="get-it-button">Get it</button>
                </a>
            </div>
        `;
    };

    const getBadgeClass = (badgeText = '') => {
        const normalized = badgeText.toLowerCase().trim();

        if (normalized.includes('%') || normalized.includes('off')) return 'badge-discount';
        if (normalized.includes('sold out')) return 'badge-soldout';
        if (normalized.includes('trend')) return 'badge-trending';

        return '';
    };

    const createCarouselHtml = (data) => {
        const descriptionText = data.description && data.description.trim()
            ? data.description
            : 'Compare features and check the latest price now.';

        return `
        <div class="hero-slide">
            <a href="${normalizeLink(data.link)}" class="hero-slide-link">
                <article class="hero-slide-card">
                    <div class="hero-slide-image-wrap">
                        <img src="${data.imagePath}" alt="${data.title}" class="hero-slide-image">
                        ${data.badge ? `<span class="hero-slide-badge ${getBadgeClass(data.badge)}">${data.badge}</span>` : ''}
                    </div>
                    <div class="hero-slide-content">
                        <h3 class="hero-slide-title">${data.title}</h3>
                        <p class="hero-slide-description">${descriptionText}</p>
                        <span class="hero-slide-cta">Shop now</span>
                    </div>
                </article>
            </a>
        </div>
    `;
    };

    const initHeroCarousel = () => {
        if (!carouselTrack || !carouselPrevButton || !carouselNextButton) return;

        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(CAROUSEL_SHEET_NAME)}`;

        let slidesData = [];
        let totalSlides = 0;
        let itemsPerView = 3;
        let cloneCount = 0;
        let currentIndex = 0;
        let autoSlideTimer = null;
        let isTransitioning = false;
        let touchStartX = 0;
        let touchEndX = 0;

        const getItemsPerView = () => {
            if (window.innerWidth <= 768) return 1;
            if (window.innerWidth <= 992) return 2;
            return 3;
        };

        const setTrackTransition = (enabled) => {
            carouselTrack.style.transition = enabled ? 'transform 0.45s ease-in-out' : 'none';
        };

        const getRealIndex = () => {
            if (!totalSlides) return 0;
            return ((currentIndex - cloneCount) % totalSlides + totalSlides) % totalSlides;
        };

        const updateDots = () => {
            if (!carouselDots) return;

            const dots = carouselDots.querySelectorAll('.hero-carousel-dot');
            const activeIndex = getRealIndex();
            const maxVisibleDots = 6;
            let startIndex = 0;

            if (dots.length > maxVisibleDots) {
                startIndex = Math.max(0, activeIndex - Math.floor(maxVisibleDots / 2));
                startIndex = Math.min(startIndex, dots.length - maxVisibleDots);
            }

            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === activeIndex);
                const isVisible = dots.length <= maxVisibleDots || (index >= startIndex && index < startIndex + maxVisibleDots);
                dot.classList.toggle('is-hidden', !isVisible);
            });
        };

        const buildDots = () => {
            if (!carouselDots) return;

            carouselDots.innerHTML = '';
            if (totalSlides <= 1) return;

            for (let i = 0; i < totalSlides; i += 1) {
                const dot = document.createElement('button');
                dot.className = 'hero-carousel-dot';
                dot.type = 'button';
                dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
                dot.addEventListener('click', () => {
                    currentIndex = cloneCount + i;
                    setTrackTransition(true);
                    updateTrackPosition();
                });
                carouselDots.appendChild(dot);
            }
        };

        const updateNavState = () => {
            const shouldDisable = totalSlides <= itemsPerView;
            carouselPrevButton.disabled = shouldDisable;
            carouselNextButton.disabled = shouldDisable;
        };

        const updateTrackPosition = () => {
            const firstSlide = carouselTrack.querySelector('.hero-slide');
            if (!firstSlide) return;

            const slideWidth = firstSlide.getBoundingClientRect().width;
            carouselTrack.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
            updateDots();
        };

        const rebuildTrack = (keepRealIndex = 0) => {
            itemsPerView = getItemsPerView();
            cloneCount = Math.min(itemsPerView, totalSlides);

            const prependClones = slidesData.slice(-cloneCount);
            const appendClones = slidesData.slice(0, cloneCount);
            const extendedSlides = [...prependClones, ...slidesData, ...appendClones];

            carouselTrack.innerHTML = extendedSlides.map(createCarouselHtml).join('');
            currentIndex = cloneCount + (keepRealIndex % totalSlides);
            setTrackTransition(false);
            updateTrackPosition();
            requestAnimationFrame(() => setTrackTransition(true));
        };

        const moveCarousel = (direction = 'next') => {
            if (isTransitioning || totalSlides <= itemsPerView) return;

            const step = itemsPerView;
            isTransitioning = true;
            setTrackTransition(true);
            if (direction === 'next') {
                currentIndex += step;
            } else {
                currentIndex -= step;
            }

            updateTrackPosition();
        };

        const stopAutoSlide = () => {
            if (autoSlideTimer) {
                clearInterval(autoSlideTimer);
                autoSlideTimer = null;
            }
        };

        const startAutoSlide = () => {
            stopAutoSlide();
            if (totalSlides <= itemsPerView) return;
            autoSlideTimer = setInterval(() => moveCarousel('next'), 4000);
        };

        carouselTrack.addEventListener('transitionend', (event) => {
            if (event.propertyName !== 'transform') return;
            if (!totalSlides) return;

            if (currentIndex >= totalSlides + cloneCount) {
                const normalized = ((currentIndex - cloneCount) % totalSlides + totalSlides) % totalSlides;
                currentIndex = cloneCount + normalized;
                setTrackTransition(false);
                updateTrackPosition();
                carouselTrack.offsetHeight;
                setTrackTransition(true);
            } else if (currentIndex < cloneCount) {
                const normalized = ((currentIndex - cloneCount) % totalSlides + totalSlides) % totalSlides;
                currentIndex = cloneCount + normalized;
                setTrackTransition(false);
                updateTrackPosition();
                carouselTrack.offsetHeight;
                setTrackTransition(true);
            }

            isTransitioning = false;
        });

        fetch(url)
            .then(response => response.text())
            .then(text => {
                const jsonData = JSON.parse(text.substring(47).slice(0, -2));
                if (jsonData.status === 'error') {
                    throw new Error(jsonData.errors[0].detailed_message);
                }

                const rows = jsonData.table.rows || [];
                const parsedSlides = rows
                    .map(row => ({
                        title: row?.c?.[1]?.v || '',
                        description: row?.c?.[2]?.v || '',
                        imagePath: row?.c?.[3]?.v || '',
                        link: row?.c?.[4]?.v || '#',
                        badge: row?.c?.[5]?.v || ''
                    }))
                    .filter(item => item.title && item.imagePath);

                slidesData = parsedSlides.slice(0, HEADER_PRODUCTS_LIMIT);
                totalSlides = slidesData.length;

                if (!totalSlides) {
                    carouselTrack.innerHTML = '<p style="color: #e0e4e8; width: 100%; text-align: center;">No carousel products found.</p>';
                    return;
                }

                rebuildTrack(0);
                buildDots();
                updateNavState();
                updateTrackPosition();

                carouselPrevButton.addEventListener('click', () => moveCarousel('prev'));
                carouselNextButton.addEventListener('click', () => moveCarousel('next'));

                const carouselShell = carouselTrack.closest('.hero-carousel-shell');
                if (carouselShell) {
                    carouselShell.addEventListener('mouseenter', stopAutoSlide);
                    carouselShell.addEventListener('mouseleave', startAutoSlide);
                }

                if (carouselViewport) {
                    carouselViewport.addEventListener('touchstart', (event) => {
                        if (!event.touches.length) return;
                        touchStartX = event.touches[0].clientX;
                        touchEndX = touchStartX;
                        stopAutoSlide();
                    }, { passive: true });

                    carouselViewport.addEventListener('touchmove', (event) => {
                        if (!event.touches.length) return;
                        touchEndX = event.touches[0].clientX;
                    }, { passive: true });

                    carouselViewport.addEventListener('touchend', () => {
                        const swipeDistance = touchEndX - touchStartX;
                        const swipeThreshold = 32;

                        if (Math.abs(swipeDistance) >= swipeThreshold) {
                            if (swipeDistance < 0) {
                                moveCarousel('next');
                            } else {
                                moveCarousel('prev');
                            }
                        }

                        startAutoSlide();
                    });
                }

                window.addEventListener('resize', () => {
                    const realIndex = getRealIndex();
                    rebuildTrack(realIndex);
                    buildDots();
                    updateNavState();
                    updateTrackPosition();
                    startAutoSlide();
                });

                startAutoSlide();
            })
            .catch(error => {
                console.error('Error loading carousel data:', error);
                carouselTrack.innerHTML = `<p style="color: #ff8a5c; width: 100%; text-align: center;">Error: Could not load carousel products.</p>`;
            });
    };

    // =========================================================
    // === FINAL HOMEPAGE SEARCH CODE WITH LAYOUT FIX ===
    // =========================================================
    const initSearchSuggestions = () => {
        const searchInput = document.querySelector('.product-search-input');
        const suggestionsWrapper = document.getElementById('suggestions-wrapper');
        const SHEET_ID = '18oQzexSZ7ix_OA6ehLg_6L6yGkV8Zy6Mqiod0h2cLnA';

        if (!searchInput || !suggestionsWrapper) {
            console.error('Search input or suggestions wrapper element not found.');
            return;
        }

        const CATEGORIES_TO_SEARCH = [
            'electronics',
            'fashion',
            'home-and-garden',
            'health-and-beauty',
            'games',
            'pet-supplies'
        ];

        let allProducts = [];
        let dataFetched = false;

        const fetchAllProducts = () => {
            if (dataFetched) return Promise.resolve();

            const promises = CATEGORIES_TO_SEARCH.map(category => {
                const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(category)}`;
                return fetch(url)
                    .then(res => res.text())
                    .then(text => {
                        const jsonData = JSON.parse(text.substring(47).slice(0, -2));
                        if (jsonData.status === 'error') return [];
                        return jsonData.table.rows.map(row => {
                            if (row && row.c && row.c.length >= 5 && row.c[1]?.v) {
                                return {
                                    title:       row.c[1].v,
                                    description: row.c[2]?.v || '',
                                    imagePath:   row.c[3]?.v || '',
                                    link:        row.c[4]?.v || '#',
                                    badge:       row.c[5]?.v || null
                                };
                            }
                            return null;
                        }).filter(Boolean);
                    });
            });

            return Promise.all(promises)
                .then(results => {
                    allProducts = results.flat();
                    dataFetched = true;
                })
                .catch(error => console.error('Failed to fetch all products for search:', error));
        };

        const displaySuggestions = (query) => {
            if (!query) {
                suggestionsWrapper.innerHTML = '';
                suggestionsWrapper.style.display = 'none';
                return;
            }

            const filtered = allProducts.filter(product =>
                product.title.toLowerCase().includes(query.toLowerCase())
            );

            if (filtered.length > 0) {
                const html = filtered.map(product => {
                    // *** THIS IS THE FIX ***
                    // This HTML structure ensures the title and badge are on the same line.
                    const badgeHtml = product.badge ? `<span class="suggestion-badge">${product.badge}</span>` : '';
                    
                    return `
                        <a href="${product.link}" class="suggestion-item">
                            <img src="${product.imagePath}" alt="${product.title}" class="suggestion-image">
                            <div class="suggestion-info">
                                <div class="suggestion-title-line">
                                    <span class="suggestion-title">${product.title}</span>
                                    ${badgeHtml}
                                </div>
                                <p class="suggestion-description">${product.description}</p>
                            </div>
                        </a>
                    `;
                }).join('');
                suggestionsWrapper.innerHTML = html;
                suggestionsWrapper.style.display = 'block';
            } else {
                suggestionsWrapper.innerHTML = `<div class="suggestion-item no-results">No products found</div>`;
                suggestionsWrapper.style.display = 'block';
            }
        };

        searchInput.addEventListener('focus', fetchAllProducts, { once: true });

        searchInput.addEventListener('input', (e) => {
            if (dataFetched) {
                displaySuggestions(e.target.value);
            } else {
                fetchAllProducts().then(() => displaySuggestions(e.target.value));
            }
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-wrapper')) {
                suggestionsWrapper.style.display = 'none';
            }
        });
    };

    // --- All Animation functions below are unchanged ---

    const initCategoryAnimation = () => {
        const categories = document.querySelectorAll('.category-column');
        if (!categories.length) return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                } else {
                    entry.target.classList.remove('in-view');
                }
            });
        }, { rootMargin: '0px 0px -10% 0px', threshold: 0 });
        categories.forEach(cat => observer.observe(cat));
    };

    const initProductAnimation = () => {
        const products = document.querySelectorAll('.product-item');
        if (!products.length) return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                } else {
                    entry.target.classList.remove('in-view');
                }
            });
        }, { rootMargin: '0px 0px -20% 0px', threshold: 0 });
        products.forEach(prod => observer.observe(prod));
    };

    const initTitleAnimation = () => {
        const titles = document.querySelectorAll('.section-title');
        if (!titles.length) return;
        titles.forEach(title => {
            const text = title.textContent.trim();
            title.innerHTML = text.split('').map((letter, index) => {
                if (letter === ' ') {
                    return `<span style="transition-delay: ${index * 50}ms; display: inline-block; width: 1.2rem;"> </span>`;
                } else {
                    return `<span style="transition-delay: ${index * 50}ms">${letter}</span>`;
                }
            }).join('');
        });
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        titles.forEach(title => observer.observe(title));
    };

    const initHeaderAnimation = () => {
        const header = document.querySelector('.site-header');
        if (!header) return;
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('header-in-view');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.95 });
        observer.observe(header);
    };

    const initMobileMenu = () => {
        const menuButton = document.getElementById('mobile-menu-button');
        const navMenu = document.getElementById('main-nav-menu');

        if (menuButton && navMenu) {
            menuButton.addEventListener('click', () => {
                navMenu.classList.toggle('is-open');
                const isExpanded = navMenu.classList.contains('is-open');
                menuButton.setAttribute('aria-expanded', isExpanded);
            });
        }
    };

    const initFooterAnimation = () => {
        const footer = document.querySelector('.site-footer-container');
        if (!footer) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    const socialIcons = footer.querySelectorAll('.social-icons a');
                    socialIcons.forEach((icon, index) => {
                        icon.style.animationDelay = `${400 + index * 80}ms`;
                    });
                } else {
                    entry.target.classList.remove('in-view');
                }
            });
        }, { threshold: 0.2 });

        observer.observe(footer);
    };

    // --- Initialize all functions ---
    if (categoriesContainer) {
      fetchData(CATEGORIES_SHEET_NAME, categoriesContainer, createCategoryHtml, initCategoryAnimation);
    }
    
    if (productsContainer) {
      fetchData(PRODUCTS_SHEET_NAME, productsContainer, createProductHtml, initProductAnimation);
    }

    initHeroCarousel();
    
    initTitleAnimation();
    initHeaderAnimation();
    initMobileMenu();
    initFooterAnimation();
    // Initialize the homepage-specific search functionality
    initSearchSuggestions();
});
