document.addEventListener('DOMContentLoaded', () => {
    const SHEET_ID = '18oQzexSZ7ix_OA6ehLg_6L6yGkV8Zy6Mqiod0h2cLnA';
    const CATEGORIES_SHEET_NAME = 'Categories';
    const PRODUCTS_SHEET_NAME = 'Products';

    const categoriesContainer = document.getElementById('categories-container');
    const productsContainer = document.getElementById('products-container');

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
            <a href="${data.link}" class="category-link">
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
                <a href="${data.link}" class="product-link product-image-link">
                    ${badgeHtml} 
                    <div class="product-image-placeholder">
                        <img src="${data.imagePath}" alt="${data.title}">
                    </div>
                </a>
                <a href="${data.link}" class="product-link">
                    <div class="product-info">
                        <h3 class="product-title">${data.title}</h3>
                        <p class="product-description">${data.description}</p>
                    </div>
                </a>
                <a href="${data.link}" class="get-it-button-link">
                    <button class="get-it-button">Get it</button>
                </a>
            </div>
        `;
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
        categories.forEach((cat, index) => {
            cat.style.transitionDelay = `${index * 150}ms`;
        });
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
        products.forEach((prod, index) => {
            prod.style.transitionDelay = `${(index % 3) * 150}ms`;
        });
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
    
    initTitleAnimation();
    initHeaderAnimation();
    initMobileMenu();
    initFooterAnimation();
    // Initialize the homepage-specific search functionality
    initSearchSuggestions();
});
