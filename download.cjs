const fs = require('fs');
const https = require('https');

const url = 'https://raw.githubusercontent.com/geohacker/india/master/district/india_district.geojson';
const targetPath = 'C:\\Users\\jaysu\\OneDrive\\Desktop\\sdis\\src\\india-districts.geojson';

https.get(url, (response) => {
    if (response.statusCode !== 200) {
        console.error('Download failed', response.statusCode);
        process.exit(1);
    }
    const file = fs.createWriteStream(targetPath);
    response.pipe(file);
    file.on('finish', () => {
        file.close();
        console.log('Download completed');
        const content = fs.readFileSync(targetPath, 'utf8');
        console.log('First 200 chars:', content.substring(0, 200));
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
