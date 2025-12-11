const fs = require('fs');
const path = 'd:\\Projects\\tofa-mobile\\components\\modals\\TaskDetailModal.tsx';
try {
    const content = fs.readFileSync(path, 'utf8');
    // Find the date picker section
    const index = content.indexOf('datePickerButton');
    // Print around 500 chars from there
    console.log(content.substring(index - 100, index + 1500));
} catch (e) {
    console.error(e);
}
