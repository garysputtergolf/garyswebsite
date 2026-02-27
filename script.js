document.addEventListener('DOMContentLoaded', () => {
    // Mobile Navigation Toggle
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.getElementById('main-nav');

    menuToggle.addEventListener('click', () => {
        nav.classList.toggle('active');

        // Hamburger animation toggle
        const spans = menuToggle.querySelectorAll('span');
        if (nav.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });

    // Sticky Header Effect
    const header = document.getElementById('main-header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
            header.style.padding = '0.5rem 0';
        } else {
            header.style.boxShadow = '0 2px 20px rgba(0,0,0,0.05)';
            header.style.padding = '1rem 0';
        }
    });

    // Reveal on Scroll Animation
    const observerOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.fade-in, .fade-in-up, .fade-in-left, .fade-in-right');
    animatedElements.forEach(el => observer.observe(el));

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            nav.classList.remove('active'); // Close mobile menu if open

            // Reset hamburger if closing menu
            const spans = menuToggle.querySelectorAll('span');
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';

            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    // Dynamic Copyright Year
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // Dynamic Menu Rendering
    const menuContainer = document.getElementById('menu-container');
    if (menuContainer && typeof MENU_DATA !== 'undefined') {

        function renderMenu(categoryKey) {
            const categoryData = MENU_DATA[categoryKey];
            if (!categoryData) return;

            let html = `<div class="menu-grid">`;

            categoryData.sections.forEach(section => {
                html += `
                <div class="menu-category-card">
                    <h3>${section.title}</h3>
                    ${section.note ? `<span class="category-note">${section.note}</span>` : ''}
                    <ul class="menu-items">
                `;

                section.items.forEach(item => {
                    html += `
                    <li class="menu-item">
                        <div>
                            <span class="item-name">${item.name}</span>
                            ${item.description ? `<span class="item-desc">${item.description}</span>` : ''}
                        </div>
                        <span class="item-price">${item.price.startsWith('$') || item.price === 'Free' || item.price === 'Various' ? item.price : '$' + item.price}</span>
                    </li>
                    `;
                });

                html += `
                    </ul>
                </div>
                `;
            });

            html += `</div>`;
            menuContainer.innerHTML = html;
        }

        // Initial Render
        renderMenu('activities');

        // Tab Switching
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all
                tabs.forEach(t => t.classList.remove('active'));
                // Add active to current
                tab.classList.add('active');

                const tabKey = tab.getAttribute('data-tab');
                renderMenu(tabKey);
            });
        });
    }
});
