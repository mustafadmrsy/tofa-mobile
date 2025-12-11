const fs = require('fs');
const path = 'd:\\Projects\\tofa-mobile\\app\\(tabs)';

try {
    if (fs.existsSync(path)) {
        fs.rmSync(path, { recursive: true, force: true });
        console.log('Successfully deleted (tabs)');
    } else {
        console.log('(tabs) does not exist');
    }
} catch (e) {
    console.error('Failed to delete:', e);
}
