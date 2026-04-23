const fs = require('fs');
const https = require('https');
const urlModule = require('url');

const MENU_TSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRCEOeYZz8Y61cSiC7w3zmO3-UOgYvIZ03SMn1OCcyG6r0oOILjQcWTj6nHRrw1GuPRn-3NNcwIeXcY/pub?output=tsv';
const ANNOUNCEMENT_TSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRCEOeYZz8Y61cSiC7w3zmO3-UOgYvIZ03SMn1OCcyG6r0oOILjQcWTj6nHRrw1GuPRn-3NNcwIeXcY/pub?gid=1262611615&single=true&output=tsv';
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
        console.log('Fetching Announcement TSV...');
        const announcementTSV = await fetchTSV(ANNOUNCEMENT_TSV_URL);

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
                if (!isNaN(price) && price !== '' && price !== 'Free' && price !== 'Various') {
                    formattedPrice = parseFloat(price).toFixed(2);
                }

                currentSection.items.push({
                    name,
                    price: formattedPrice,
                    description: description || "",
                    popular: popular ? popular.toLowerCase() === 'true' : false
                });
            }
        });

        // Parse Announcement
        const announcementLines = announcementTSV.split('\n').filter(line => line.trim() !== '');
        let announcementData = null;
        if (announcementLines.length > 1) {
            const cols = announcementLines[1].split('\t').map(s => s.trim());
            // Columns: Start Date, End Date, Announcement Text
            const [startDateStr, endDateStr, text] = cols;
            announcementData = {
                text,
                startDate: startDateStr,
                endDate: endDateStr
            };
        }

        // Generate JS file content
        const fileContent = `// AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
// Updated: ${new Date().toISOString()}

const MENU_DATA = ${JSON.stringify(menuData, null, 4)};

const ANNOUNCEMENT_DATA = ${JSON.stringify(announcementData, null, 4)};
`;

        fs.writeFileSync(OUTPUT_FILE, fileContent);
        console.log('Successfully updated menu_data.js');

    } catch (error) {
        console.error('Error refreshing data:', error);
        process.exit(1);
    }
}

refreshData();
