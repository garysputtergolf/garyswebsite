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
        threshold: 0.02, /* Lower threshold so giant galleries trigger quickly */
        rootMargin: "0px 0px -20px 0px" /* Slightly less padding from bottom viewport edge */
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

        const ICON_MAP = {
            "Putter Golf": "ph-flag-pennant",
            "Outdoor Fun": "ph-boat",
            "Gem Mining": "ph-sketch-logo",
            "Rentals": "ph-house-line",
            "Combo Meals": "ph-hamburger",
            "Sandwiches & More": "ph-bread",
            "Vegetarian": "ph-leaf",
            "Sides & Snacks": "ph-cookie",
            "Salads": "ph-plant",
            "Ice Cream Treats": "ph-ice-cream"
        };

        function renderMenu(categoryKey) {
            const categoryData = MENU_DATA[categoryKey];
            if (!categoryData) return;

            let html = `<div class="menu-grid">`;

            categoryData.sections.forEach((section, sIndex) => {
                const iconClass = ICON_MAP[section.title] || "ph-fork-knife";
                const delay = sIndex * 100;

                html += `
                <div class="menu-category-card fade-in-up" style="transition-delay: ${delay}ms">
                    <div class="card-header">
                        <div class="category-icon"><i class="ph ph-bold ${iconClass}"></i></div>
                        <h3>${section.title}</h3>
                    </div>
                    ${section.note ? `<span class="category-note">${section.note}</span>` : ''}
                    <ul class="menu-items">
                `;

                section.items.forEach(item => {
                    const isPopular = item.popular === true;
                    let rawPrice = item.price;
                    if (!isNaN(rawPrice) && rawPrice !== '' && rawPrice !== 'Free' && rawPrice !== 'Various' && !rawPrice.includes('.')) {
                        rawPrice = parseFloat(rawPrice).toFixed(2);
                    }
                    const price = rawPrice.toString().startsWith('$') || rawPrice === 'Free' || rawPrice === 'Various' ? rawPrice : '$' + rawPrice;

                    // Group last word and star together to prevent orphans
                    const nameParts = item.name.split(' ');
                    const lastName = nameParts.pop();
                    const namePrefix = nameParts.length > 0 ? nameParts.join(' ') + ' ' : '';
                    const starIcon = isPopular ? `<span class="star-wrapper"><i class="ph ph-fill ph-star" style="color: var(--secondary-color); margin-left: 5px;" title="Fan Favorite"></i></span>` : '';

                    html += `
                    <li class="menu-item">
                        <div class="item-main">
                            <span class="item-name">${namePrefix}<span style="white-space: nowrap;">${lastName}${starIcon}</span></span>
                            <div class="item-dots"></div>
                            <span class="item-price">${price}</span>
                        </div>
                        ${item.description ? `<span class="item-desc">${item.description}</span>` : ''}
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

            // Re-observe new elements
            const newElements = menuContainer.querySelectorAll('.fade-in-up');
            newElements.forEach(el => observer.observe(el));
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
                    const imgSrc = `assets/ig_media/${post.id}.jpg`;

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

    // Announcement & Season Status Logic
    const announcementBar = document.getElementById('announcement-bar');
    const announcementText = document.getElementById('announcement-text');
    
    function updateAnnouncement() {
        if (!announcementBar || !announcementText) return;

        const now = new Date();
        let activeAnnouncement = null;

        // 1. Check Manual Announcements
        if (typeof ANNOUNCEMENTS_DATA !== 'undefined' && ANNOUNCEMENTS_DATA) {
            const start = new Date(ANNOUNCEMENTS_DATA.startDate);
            const end = new Date(ANNOUNCEMENTS_DATA.endDate);
            if (now >= start && now <= end) {
                activeAnnouncement = ANNOUNCEMENTS_DATA.text;
            }
        }

        // 2. Check Season Status (if no manual announcement)
        if (!activeAnnouncement && typeof SEASON_DATA !== 'undefined' && SEASON_DATA) {
            const openDate = new Date(SEASON_DATA.openDate);
            const closeDate = new Date(SEASON_DATA.closeDate);
            
            if (now < openDate) {
                const openStr = openDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
                activeAnnouncement = `Closed for the season. Join us for our 2026 opening on ${openStr}!`;
            } else if (now > closeDate) {
                activeAnnouncement = "Closed for the season. See you next year!";
            }
        }

        if (activeAnnouncement) {
            announcementText.textContent = activeAnnouncement;
            announcementBar.style.display = 'block';
            document.body.classList.add('announcement-active');
            
            // Add padding to body so the fixed header isn't covered
            const updateLayout = () => {
                const barHeight = announcementBar.offsetHeight;
                document.body.style.paddingTop = barHeight + 'px';
                if (header) {
                    const scrollY = Math.max(0, window.scrollY);
                    header.style.top = Math.max(0, barHeight - scrollY) + 'px';
                }
            };
            
            window.addEventListener('scroll', updateLayout, { passive: true });
            window.addEventListener('resize', updateLayout);
            setTimeout(updateLayout, 100);
        } else {
            announcementBar.style.display = 'none';
            document.body.classList.remove('announcement-active');
            document.body.style.paddingTop = '0';
            if (header) header.style.top = '0';
        }
    }

    updateAnnouncement();

    // Dynamic Hours Rendering (Grouped & Compact)
    function renderHours() {
        const footerHoursContainer = document.getElementById('footer-hours-container');
        if (typeof HOURS_DATA === 'undefined' || !HOURS_DATA || !footerHoursContainer) return;
        
        const groupEntries = (entries) => {
            if (!entries || entries.length === 0) return [];
            const groups = [];
            let current = null;
            
            entries.forEach(entry => {
                const timeStr = entry.open === 'Closed' ? 'Closed' : `${entry.open} - ${entry.close}`;
                if (current && current.time === timeStr) {
                    current.endDay = entry.day;
                } else {
                    if (current) groups.push(current);
                    current = { startDay: entry.day, endDay: entry.day, time: timeStr };
                }
            });
            if (current) groups.push(current);
            return groups;
        };

        const regularGroups = groupEntries(HOURS_DATA.regular);
        let hoursHtml = '<ul class="hours-list compact">';
        
        // Add Season Dates at the top
        if (typeof SEASON_DATA !== 'undefined' && SEASON_DATA) {
            const openDate = new Date(SEASON_DATA.openDate);
            const closeDate = new Date(SEASON_DATA.closeDate);
            const openStr = openDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const closeStr = closeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            hoursHtml += `<li class="season-dates"><span class="day">2026 Season:</span> <span class="time">${openStr} - ${closeStr}</span></li>`;
        }

        regularGroups.forEach(g => {
            const dayLabel = g.startDay === g.endDay ? g.startDay : `${g.startDay.substring(0, 3)} - ${g.endDay.substring(0, 3)}`;
            hoursHtml += `<li><span class="day">${dayLabel}:</span> <span class="time">${g.time}</span></li>`;
        });

        if (HOURS_DATA.custom.length > 0) {
            HOURS_DATA.custom.forEach(entry => {
                hoursHtml += `<li class="holiday-hours"><span class="day">${entry.day}:</span> <span class="time">${entry.open} - ${entry.close}</span></li>`;
            });
        }
        hoursHtml += '</ul>';
        footerHoursContainer.innerHTML = hoursHtml;
    }

    renderHours();

    // Safari Overscroll "Backing Blocks" Implementation
    // Creates fixed blocks behind the content to handle top/bottom spill colors
    const topBacking = document.createElement('div');
    topBacking.id = 'overscroll-top-backing';
    topBacking.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:50vh; background:var(--secondary-color); z-index:-10; pointer-events:none;';
    
    const bottomBacking = document.createElement('div');
    bottomBacking.id = 'overscroll-bottom-backing';
    bottomBacking.style.cssText = 'position:fixed; bottom:0; left:0; width:100%; height:50vh; background:var(--primary-color); z-index:-10; pointer-events:none;';
    
    document.body.prepend(topBacking);
    document.body.prepend(bottomBacking);
});
