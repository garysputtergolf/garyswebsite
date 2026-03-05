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
    let isScrolled = false;

    window.addEventListener('scroll', () => {
        const shouldBeScrolled = window.scrollY > 50;
        if (shouldBeScrolled !== isScrolled) {
            isScrolled = shouldBeScrolled;
            header.classList.toggle('scrolled', isScrolled);
        }
    }, { passive: true });

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

    // Dynamic Instagram Feed Rendering
    const igGridContainer = document.getElementById('ig-grid-container');
    if (igGridContainer) {
        fetch('assets/instagram_feed.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                const posts = data.data;
                if (!posts || posts.length === 0) {
                    igGridContainer.innerHTML = '<p>Follow us on Instagram to see more!</p>';
                    return;
                }

                let html = '';
                posts.forEach((post, index) => {
                    const delayClass = index > 0 ? `delay-${index * 100}` : '';
                    const imgSrc = post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url;

                    let mediaTypeLabel = '';
                    let mediaIcon = '';
                    if (post.media_type === 'VIDEO') {
                        mediaTypeLabel = 'Reel';
                        mediaIcon = '▶️';
                    } else if (post.media_type === 'CAROUSEL_ALBUM') {
                        mediaTypeLabel = 'Carousel';
                        mediaIcon = '📑';
                    } else {
                        mediaTypeLabel = 'Photo';
                        mediaIcon = '📷';
                    }

                    const caption = post.caption ? post.caption : '';
                    const shortCaption = caption.length > 80 ? caption.substring(0, 80) + '...' : caption;

                    html += `
                    <a href="${post.permalink}" target="_blank" class="ig-post fade-in ${delayClass}">
                        <img src="${imgSrc}" alt="${caption.substring(0, 50)}" loading="lazy">
                        <div class="ig-overlay">
                            <div class="ig-content">
                                <span class="ig-type">${mediaIcon}</span>
                                <p class="ig-caption">${shortCaption}</p>
                                <span class="ig-btn">View on Instagram</span>
                            </div>
                        </div>
                    </a>
                    `;
                });

                igGridContainer.innerHTML = html;

                // Re-observe newly added elements for animation
                const newAnimatedElements = igGridContainer.querySelectorAll('.fade-in');
                newAnimatedElements.forEach(el => observer.observe(el));
            })
            .catch(error => {
                console.error('Error loading Instagram feed:', error);
                // Fail silently by not showing anything, or show a fallback message
            });
    }
});
