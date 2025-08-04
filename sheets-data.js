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
                container.innerHTML = ''; // This removes the loader
                const rows = jsonData.table.rows;
                rows.forEach(row => {
                    if (row && row.c && row.c.length >= 3) {
                        // MODIFIED: Added 'badge' to the rowData object
                        const rowData = {
                            id: row.c[0] ? row.c[0].v : '',
                            name: row.c[1] ? row.c[1].v : '',
                            imagePath: row.c[2] ? row.c[2].v : '',
                            link: row.c[3] ? row.c[3].v : '#',
                            title: row.c[4] ? row.c[4].v : '',
                            description: row.c[5] ? row.c[5].v : '',
                            badge: row.c[6] ? row.c[6].v : null // NEW: Get badge text from column G
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

    // MODIFIED: Added logic to conditionally create a clickable badge
    const createProductHtml = (data) => {
        const divider = (data.id > 1 && (data.id - 1) % 3 === 0) ? '<hr class="product-divider">' : '';
        // NEW: Create badge HTML only if badge text exists
        const badgeHtml = data.badge ? `<div class="product-badge">${data.badge}</div>` : '';

        return `
            ${divider}
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

    // --- All animation functions remain the same ---

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
            title.innerHTML = text.split('').map((letter, index) => 
                `<span style="transition-delay: ${index * 50}ms">${letter === ' ' ? ' ' : letter}</span>`
            ).join('');
        });
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                } else {
                    entry.target.classList.remove('in-view');
                }
            });
        }, { threshold: 0.5 });
        titles.forEach(title => observer.observe(title));
    };

    const initHeaderAnimation = () => {
        const header = document.querySelector('.site-header');
        if (!header) return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('header-in-view');
                } else {
                    entry.target.classList.remove('in-view');
                }
            });
        }, { threshold: 0.95 });
        observer.observe(header);
    };

    if (categoriesContainer) fetchData(CATEGORIES_SHEET_NAME, categoriesContainer, createCategoryHtml, initCategoryAnimation);
    if (productsContainer) fetchData(PRODUCTS_SHEET_NAME, productsContainer, createProductHtml, initProductAnimation);
    
    initTitleAnimation();
    initHeaderAnimation();
});
