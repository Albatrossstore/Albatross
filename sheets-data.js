document.addEventListener('DOMContentLoaded', () => {
    // The ID of your Google Sheet
    const SHEET_ID = '18oQzexSZ7ix_OA6ehLg_6L6yGkV8Zy6Mqiod0h2cLnA';

    // The names of the tabs in your sheet
    const CATEGORIES_SHEET_NAME = 'Categories';
    const PRODUCTS_SHEET_NAME = 'Products';

    // The containers in your HTML to fill with content
    const categoriesContainer = document.getElementById('categories-container');
    const productsContainer = document.getElementById('products-container');

    // Main function to fetch and process data from a specific sheet
    const fetchData = (sheetName, container, createHtmlFunction) => {
        // Construct the URL to fetch the sheet data as JSON
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(text => {
                // The response is JSONP. We need to parse it correctly by removing the function wrapper.
                const jsonData = JSON.parse(text.substring(47).slice(0, -2));

                // Check for errors in the returned data from Google
                if (jsonData.status === 'error') {
                    throw new Error(jsonData.errors[0].detailed_message);
                }

                const rows = jsonData.table.rows;
                
                // Clear the "Loading..." message
                container.innerHTML = '';

                // Build the HTML from the sheet data
                rows.forEach(row => {
                    if (row && row.c && row.c.length >= 3) {
                        const rowData = {
                            id: row.c[0] ? row.c[0].v : '',
                            name: row.c[1] ? row.c[1].v : '',
                            imagePath: row.c[2] ? row.c[2].v : ''
                        };
                        container.innerHTML += createHtmlFunction(rowData);
                    }
                });
            })
            .catch(error => {
                console.error(`Error fetching data for ${sheetName}:`, error);
                container.innerHTML = `<p style="color: #ff8a5c; font-size: 1.2rem;">Error: Could not load content. Please ensure the Google Sheet is public ('Anyone with the link') and 'Published to the web'.</p>`;
            });
    };

    // --- HTML Template Creation Functions ---

    // Creates the HTML for a single category item
    const createCategoryHtml = (data) => {
        return `
            <div class="category-column">
                <div class="category-image-placeholder">
                    <img src="${data.imagePath}" alt="${data.name}">
                </div>
                <button class="category-button">${data.name}</button>
            </div>
        `;
    };

    // Creates the HTML for a single product item
    const createProductHtml = (data) => {
        // Adds a divider before each new row of 3 products
        const divider = (data.id > 1 && (data.id - 1) % 3 === 0) ? '<hr class="product-divider">' : '';
        
        return `
            ${divider}
            <div class="product-item">
                <div class="product-image-placeholder">
                    <img src="${data.imagePath}" alt="Featured Product">
                </div>
                <button class="get-it-button">Get it</button>
            </div>
        `;
    };

    // --- Trigger the data fetching when the page loads ---
    if (categoriesContainer) {
        fetchData(CATEGORIES_SHEET_NAME, categoriesContainer, createCategoryHtml);
    }
    if (productsContainer) {
        fetchData(PRODUCTS_SHEET_NAME, productsContainer, createProductHtml);
    }
});