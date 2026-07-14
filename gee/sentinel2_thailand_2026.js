/*
 * Sentinel-2 Cloud-Free Median Composite for Thailand (2026)
 *
 * HOW TO USE:
 * 1. Go to code.earthengine.google.com
 * 2. Create a new script and paste this entire code
 * 3. Click "Run"
 * 4. Check the "Console" tab (right panel) for the printed tile URL
 * 5. Copy the URL starting with "https://ee.google..."
 * 6. Paste it into the SENTINEL2_TILE_URL variable in Sentinel2.html
 *
 * NOTE: The tile URL token is temporary (expires after ~1 hour in interactive mode).
 * Re-run this script and update Sentinel2.html if the layer stops loading.
 * For permanent hosting, use Earth Engine Apps (out of scope here).
 */

// Define Thailand boundary using FAO/GAUL dataset (built-in, no upload needed)
var thailand = ee.FeatureCollection('FAO/GAUL/2015/level0')
  .filter(ee.Filter.eq('ADM0_NAME', 'Thailand'));

// Load Sentinel-2 Surface Reflectance (harmonized) collection
var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(thailand)
  .filterDate('2026-01-01', ee.Date(Date.now())) // 2026 Jan 1 to today
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 50)); // Pre-filter to reduce processing

// Function to mask clouds using QA60 bitmask
function maskClouds(image) {
  var qa = image.select('QA60');
  // Bits 10 and 11 are clouds and cirrus, respectively
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
    .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
  return image.updateMask(mask)
    .divide(10000) // Scale reflectance from 0-10000 to 0-1
    .select('B[2-4]', ['B2', 'B3', 'B4']); // Select blue, green, red
}

// Apply cloud mask to all images
var cloudFree = s2.map(maskClouds);

// Compute median composite
var median = cloudFree.median();

// Clip to Thailand boundary
var rgb = median.clip(thailand);

// Define visualization parameters (true-color: red, green, blue)
var visParams = {
  bands: ['B4', 'B3', 'B2'], // Red, Green, Blue
  min: 0,
  max: 0.3,
  gamma: [1, 1, 1]
};

// Visualize and add to map preview
Map.setCenter(100.99, 15.87, 5); // Center on Thailand
Map.addLayer(rgb, visParams, 'Sentinel-2 Median 2026');

// Print the tile URL for the user to copy into Sentinel2.html
var tileUrl = rgb.getMapId(visParams);
print('📍 COPY THIS URL INTO SENTINEL2.html:');
print(tileUrl.urlFormat);

// Additional info for debugging
print('');
print('Date range: 2026-01-01 to ' + ee.Date(Date.now()).format('YYYY-MM-dd').getInfo());
print('Cloud mask: QA60 bits 10-11 (cloud + cirrus)');
print('Bands: B4(Red), B3(Green), B2(Blue)');
print('Reducer: Median');
print('');
print('Note: This token is temporary. Re-run this script to refresh if the tile URL expires.');
