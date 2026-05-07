const fs = require('fs');
const prefsUi = fs.readFileSync('prefs.ui', 'utf8');
const keys = [ 'show-temperature', 'show-voltage', 'show-fan',
                        'show-memory', 'show-processor', 'show-system',
                        'show-network', 'show-storage', 'use-higher-precision',
                        'alphabetize', 'hide-zeros', 'include-public-ip',
                        'network-public-ip-show-flag', 'show-battery', 'fixed-widths',
                        'hide-icons', 'menu-centered', 'include-static-info',
                        'show-gpu', 'include-static-gpu-info',
                        'position-in-panel', 'unit', 'network-speed-format', 'memory-measurement', 'storage-measurement', 'battery-slot', 'icon-style',
                        'update-time', 'network-public-ip-interval', 'storage-path', 'monitor-cmd' ];
let missing = [];
for (let key of keys) {
    if (!prefsUi.includes('id="' + key + '"')) {
        missing.push(key);
    }
}
console.log("Missing in prefs.ui:", missing);
