const fs = require('fs');
const https = require('https');
const urlModule = require('url');

const MENU_TSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTNgWYHSmUyj_wZ1wz33fVdIZEWWVw1RJfDAFg-U7yoIccaVTTbT2zH1xVv5m_kR9dPQYI04EiN00wR/pub?output=tsv';
const ANNOUNCEMENTS_TSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTNgWYHSmUyj_wZ1wz33fVdIZEWWVw1RJfDAFg-U7yoIccaVTTbT2zH1xVv5m_kR9dPQYI04EiN00wR/pub?gid=1262611615&single=true&output=tsv';
const HOURS_TSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTNgWYHSmUyj_wZ1wz33fVdIZEWWVw1RJfDAFg-U7yoIccaVTTbT2zH1xVv5m_kR9dPQYI04EiN00wR/pub?gid=1730481784&single=true&output=tsv';
const SEASON_TSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTNgWYHSmUyj_wZ1wz33fVdIZEWWVw1RJfDAFg-U7yoIccaVTTbT2zH1xVv5m_kR9dPQYI04EiN00wR/pub?gid=915434937&single=true&output=tsv';
const OUTPUT_FILE = './assets/js/menu_data.js';

function fetchTSV(url) {
    return new Promise((resolve, reject) => {
        function get(url) {
            https.get(url, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    // Follow redirect
                    return get(urlModule.resolve(url, res.headers.location));
                }
                
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve(data));
            }).on('error', reject);
        }
        get(url);
    });
}

async function refreshData() {
    try {
        console.log('Fetching Menu TSV...');
        const menuTSV = await fetchTSV(MENU_TSV_URL);
        console.log('Fetching Announcements TSV...');
        const announcementsTSV = await fetchTSV(ANNOUNCEMENTS_TSV_URL);
        console.log('Fetching Hours TSV...');
        const hoursTSV = await fetchTSV(HOURS_TSV_URL);
        console.log('Fetching Season TSV...');
        const seasonTSV = await fetchTSV(SEASON_TSV_URL);

        // Parse Menu
        const menuLines = menuTSV.split('\n').filter(line => line.trim() !== '');
        const menuData = {
            activities: { title: "Fun & Activities", sections: [] },
            food: { title: "Jiffy Pup Restaurant", sections: [] }
        };

        let currentCategory = null;
        let currentSection = null;

        menuLines.forEach((line, index) => {
            if (index === 0) return; // Skip header
            const cols = line.split('\t').map(s => s.trim());
            // Columns: Category, Section Title, Item Name, Price, Description, Popular Item
            const [category, section, name, price, description, popular] = cols;

            if (category && menuData[category.toLowerCase()]) {
                currentCategory = menuData[category.toLowerCase()];
            }

            if (section) {
                currentSection = currentCategory.sections.find(s => s.title === section);
                if (!currentSection) {
                    currentSection = { title: section, items: [] };
                    currentCategory.sections.push(currentSection);
                }
            }

            if (name && currentSection) {
                let formattedPrice = price || "";
                // Format to 2 decimal places if numeric
                if (!isNaN(price) && price !== '' && price !== 'Free' && price !== 'Various' && !price.includes('.')) {
                    formattedPrice = parseFloat(price).toFixed(2);
                }

                // Special handling for Combo Meals to add section note and clear item descriptions
                let itemDescription = description || "";
                if (currentSection.title === "Combo Meals") {
                    currentSection.note = "Includes fries & soda";
                    if (itemDescription.toLowerCase() === "includes fries & soda") {
                        itemDescription = "";
                    }
                }

                currentSection.items.push({
                    name,
                    price: formattedPrice,
                    description: itemDescription,
                    popular: popular ? popular.toLowerCase() === 'true' : false
                });
            }
        });

        // Parse Announcements
        const announcementLines = announcementsTSV.split('\n').filter(line => line.trim() !== '');
        let announcementsData = null;
        if (announcementLines.length > 1) {
            const cols = announcementLines[1].split('\t').map(s => s.trim());
            // Columns: Start Date, End Date, Announcement Text
            const [startDateStr, endDateStr, text] = cols;
            announcementsData = {
                text,
                startDate: startDateStr,
                endDate: endDateStr
            };
        }

        // Parse Hours
        const hoursLines = hoursTSV.split('\n').filter(line => line.trim() !== '');
        const hoursData = {
            regular: [],
            custom: []
        };
        const formatTime = (timeStr) => {
            if (!timeStr) return '';
            // Strip seconds if present (e.g., 11:00:00 AM -> 11:00 AM)
            return timeStr.replace(/:00(?=\s|$)/g, '').replace(/:(\d{2}):00/g, ':$1');
        };

        hoursLines.forEach((line, index) => {
            if (index === 0) return; // Skip header
            const cols = line.split('\t').map(s => s.trim());
            const [day, open, close, isRegular, isCustom, isHidden] = cols;
            
            // Skip hidden entries
            if (isHidden && isHidden.toLowerCase() === 'true') return;

            if (day && open && close) {
                const entry = { 
                    day, 
                    open: formatTime(open), 
                    close: formatTime(close) 
                };
                if (isRegular && isRegular.toLowerCase() === 'true') {
                    hoursData.regular.push(entry);
                } else if (isCustom && isCustom.toLowerCase() === 'true') {
                    hoursData.custom.push(entry);
                }
            }
        });

        // Parse Season
        const seasonLines = seasonTSV.split('\n').filter(line => line.trim() !== '');
        let seasonData = null;
        if (seasonLines.length > 1) {
            const cols = seasonLines[1].split('\t').map(s => s.trim());
            const [openDate, closeDate] = cols;
            seasonData = { openDate, closeDate };
        }

        // Generate the new data string for comparison
        const newDataString = `const MENU_DATA = ${JSON.stringify(menuData, null, 4)};\n\nconst ANNOUNCEMENTS_DATA = ${JSON.stringify(announcementsData, null, 4)};\n\nconst HOURS_DATA = ${JSON.stringify(hoursData, null, 4)};\n\nconst SEASON_DATA = ${JSON.stringify(seasonData, null, 4)};`;

        // Check if file exists and compare content
        let shouldUpdate = true;
        if (fs.existsSync(OUTPUT_FILE)) {
            const currentContent = fs.readFileSync(OUTPUT_FILE, 'utf8');
            // Extract just the data parts (ignoring the timestamp line)
            const currentDataMatch = currentContent.match(/\n\n(const MENU_DATA = [\s\S]+)/);
            if (currentDataMatch && currentDataMatch[1].trim() === newDataString.trim()) {
                shouldUpdate = false;
            }
        }

        if (shouldUpdate) {
            const fileContent = `// AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
// Updated: ${new Date().toISOString()}

${newDataString}
`;
            fs.writeFileSync(OUTPUT_FILE, fileContent);
            console.log('Successfully updated menu_data.js');
        } else {
            console.log('No changes detected in menu or announcement data. Skipping update.');
        }

    } catch (error) {
        console.error('Error refreshing data:', error);
        process.exit(1);
    }
}

refreshData();
