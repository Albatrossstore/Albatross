document.addEventListener('DOMContentLoaded', () => {
  // === HEADER LOADING FUNCTION ===
  const loadHeader = () => {
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (!headerPlaceholder) {
      console.error('Header placeholder element with ID "header-placeholder" not found.');
      return;
    }
    // UPDATED PATH
    fetch('/Albatross-main/header.html')
      .then(response => response.text())
      .then(data => {
        headerPlaceholder.innerHTML = data;
        initHeaderAnimation();
        initMobileMenu();
        initSearchSuggestions();
      })
      .catch(error => console.error('Failed to fetch header:', error));
  };

  // === FOOTER LOADING FUNCTION (for pages that need it) ===
  const loadFooter = () => {
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (!footerPlaceholder) {
      return; 
    }
    // UPDATED PATH
    fetch('/Albatross-main/footer.html')
      .then(response => response.text())
      .then(data => {
        footerPlaceholder.innerHTML = data;
      })
      .catch(error => console.error('Failed to fetch footer:', error));
  };

  // === CALL THE LOADING FUNCTIONS ===
  loadHeader();
  loadFooter(); 

  initFooterAnimation();
  
  const SHEET_ID = '18oQzexSZ7ix_OA6ehLg_6L6yGkV8Zy6Mqiod0h2cLnA';

  const getCategoryName = () => {
    const titleEl = document.getElementById('category-title');
    if (titleEl && titleEl.textContent) {
      return titleEl.textContent.trim().toLowerCase().replace(/\s+/g, '-');
    }
    const pageTitle = document.title.split('-')[0].trim();
    if (pageTitle) {
      return pageTitle.toLowerCase().replace(/\s+/g, '-');
    }
    return 'electronics'; // Fallback category
  };

  const CATEGORY_NAME = getCategoryName();
  const productsContainer = document.getElementById('products-container');

  if (productsContainer) {
    const titleElement = document.getElementById('category-title');
    if (titleElement) {
      titleElement.textContent = CATEGORY_NAME.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      initCategoryTitleAnimation();
    }
    fetchDataForCategory();
  }

  function fetchDataForCategory() {
    if (!productsContainer) {
      return;
    }
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(CATEGORY_NAME)}`;
    fetch(url)
      .then((response) => response.text())
      .then((text) => {
        const jsonData = JSON.parse(text.substring(47).slice(0, -2));
        if (jsonData.status === 'error') throw new Error(jsonData.errors[0]?.detailed_message || 'Unknown error');

        let html = '';
        jsonData.table.rows.forEach((row) => {
          if (row && row.c && row.c.length >= 5) {
            const productData = {
              title: row.c[1]?.v || '',
              description: row.c[2]?.v || '',
              imagePath: row.c[3]?.v || '',
              link: row.c[4]?.v || '#',
              badge: row.c[5]?.v || null
            };
            if (productData.title) html += createProductHtml(productData);
          }
        });
        productsContainer.innerHTML = html;
        initLayoutAndAnimations();
      })
      .catch((error) => {
        console.error(`Failed to fetch data for category "${CATEGORY_NAME}":`, error);
        productsContainer.innerHTML = `<p class="error-message">Could not load products. ${error.message}</p>`;
      });
  };

  const initSearchSuggestions = () => {
    const searchInput = document.querySelector('.product-search-input');
    const suggestionsWrapper = document.getElementById('suggestions-wrapper');
    const SHEET_ID = '18oQzexSZ7ix_OA6ehLg_6L6yGkV8Zy6Mqiod0h2cLnA';

    if (!searchInput || !suggestionsWrapper) {
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

  function createProductHtml(data) {
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

  function initCategoryTitleAnimation() {
    const title = document.getElementById('category-title');
    if (!title) return;
    const text = title.textContent.trim();
    title.innerHTML = text.split('').map((letter) => {
      if (letter === ' ') {
        return `<span style="display: inline-block; width: 1rem;"> </span>`;
      } else {
        return `<span>${letter}</span>`;
      }
    }).join('');
    const letters = title.querySelectorAll('span');
    letters.forEach(letter => {
      letter.style.opacity = '0';
      letter.style.transform = 'translateY(25px) rotateZ(15deg)';
    });
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          letters.forEach((letter, index) => {
            letter.animate([
              { transform: 'translateY(25px) rotateZ(15deg)', opacity: 0 },
              { transform: 'translateY(0) rotateZ(0)', opacity: 1 }
            ], {
              duration: 800,
              easing: 'cubic-bezier(0.77, 0, 0.175, 1)',
              delay: index * 50,
              fill: 'forwards'
            });
          });
        } else {
          letters.forEach(letter => {
            letter.style.opacity = '0';
            letter.style.transform = 'translateY(25px) rotateZ(15deg)';
          });
        }
      });
    }, { threshold: 0.5 });
    observer.observe(title);
  }

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
        const isExpanded = menuButton.getAttribute('aria-expanded') === 'true';
        menuButton.setAttribute('aria-expanded', !isExpanded);
        navMenu.classList.toggle('is-open');
      });
    }
  };

  function initLayoutAndAnimations() {
    const products = Array.from(document.querySelectorAll('.product-item'));
    if (!products.length) return;
    const isPhone = () => window.innerWidth <= 600;
    const getColumnsPerRow = () => isPhone() ? Math.min(products.length, 2) : 4;
    const inViewSet = new Set();
    const applyGridLayout = () => {
      const columns = getColumnsPerRow();
      productsContainer.style.display = 'grid';
      productsContainer.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
      productsContainer.style.justifyContent = 'center';
      if (isPhone() && columns === 2) {
        productsContainer.style.gap = '8px';
        productsContainer.style.padding = '0 6px';
        productsContainer.classList.add('mobile-two-col');
      } else {
        productsContainer.style.gap = '30px';
        productsContainer.style.padding = '';
        productsContainer.classList.remove('mobile-two-col');
      }
    };
    const applyAnimationStyles = () => {
      const columns = getColumnsPerRow();
      products.forEach((product, index) => {
        const rowIndex = Math.floor(index / columns);
        const fromLeft = rowIndex % 2 === 0;
        product.dataset.startSide = fromLeft ? 'left' : 'right';
        product.dataset.colIndex = index % columns;
        if (!inViewSet.has(product)) {
          product.style.transition = 'transform 500ms ease, opacity 500ms ease';
          product.style.transform = fromLeft ? `translateX(-50px)` : `translateX(50px)`;
          product.style.opacity = '0';
        }
      });
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const el = entry.target;
        if (entry.isIntersecting) {
          inViewSet.add(el);
          const delay = parseInt(el.dataset.colIndex) * 100;
          el.style.transition = `transform 500ms ease ${delay}ms, opacity 500ms ease ${delay}ms`;
          el.style.transform = `translateX(0)`;
          el.style.opacity = '1';
        } else {
          inViewSet.delete(el);
          const startSide = el.dataset.startSide || 'left';
          el.style.transition = 'transform 500ms ease, opacity 500ms ease';
          el.style.transform = startSide === 'left' ? `translateX(-50px)` : `translateX(50px)`;
          el.style.opacity = '0';
        }
      });
    }, { rootMargin: '0px 0px -20% 0px', threshold: 0 });
    products.forEach((product) => observer.observe(product));
    applyGridLayout();
    applyAnimationStyles();
    window.addEventListener('resize', () => {
      applyGridLayout();
      applyAnimationStyles();
    }, { passive: true });
  };

  function initFooterAnimation() {
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
});
