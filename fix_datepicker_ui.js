const fs = require('fs');

function fixTaskDetailModal() {
    const path = 'd:\\Projects\\tofa-mobile\\components\\modals\\TaskDetailModal.tsx';
    if (!fs.existsSync(path)) return;

    let content = fs.readFileSync(path, 'utf8');

    // Anchor: onPress={() => setShowDatePicker(true)}
    const anchor = `onPress={() => setShowDatePicker(true)}`;
    const anchorIndex = content.indexOf(anchor);

    if (anchorIndex !== -1) {
        // Find start of TouchableOpacity
        const touchableStart = content.lastIndexOf('<TouchableOpacity', anchorIndex);

        // Find end of the block. The block ends with the closing of the conditional DatePicker: ')}'
        // Logic: Find <DatePicker ... /> then find )} right after it.
        const pickerStart = content.indexOf('<DatePicker', anchorIndex);
        if (pickerStart === -1) {
            console.log('Could not find DatePicker in TaskDetailModal');
            return;
        }

        const pickerEnd = content.indexOf('/>', pickerStart);
        const blockEnd = content.indexOf(')}', pickerEnd) + 2;

        if (touchableStart !== -1 && blockEnd !== -1) {
            const originalBlock = content.substring(touchableStart, blockEnd);

            // Validate block contains what we expect
            if (originalBlock.includes('setShowDatePicker(true)') && originalBlock.includes('<DatePicker')) {
                const newBlock = `{Platform.OS === 'web' ? (
                                <DatePicker
                                    value={editedDueDate}
                                    onChange={onDateChange}
                                    minimumDate={new Date()}
                                />
                            ) : (
                                <>
                                    ${originalBlock}
                                </>
                            )}`;

                content = content.replace(originalBlock, newBlock);
                fs.writeFileSync(path, content, 'utf8');
                console.log('Fixed TaskDetailModal');
            } else {
                console.log('Block validation failed for TaskDetailModal');
            }
        }
    } else {
        console.log('Anchor not found in TaskDetailModal');
    }
}

function fixCreateTaskModal() {
    const path = 'd:\\Projects\\tofa-mobile\\components\\modals\\CreateTaskModal.tsx';
    if (!fs.existsSync(path)) return;

    let content = fs.readFileSync(path, 'utf8');

    // Anchor: onPress={() => setShowDatePicker(true)}
    const anchor = `onPress={() => setShowDatePicker(true)}`;
    const anchorIndex = content.indexOf(anchor);

    if (anchorIndex !== -1) {
        const touchableStart = content.lastIndexOf('<TouchableOpacity', anchorIndex);
        const pickerStart = content.indexOf('<DatePicker', anchorIndex);
        if (pickerStart === -1) {
            console.log('Could not find DatePicker in CreateTaskModal');
            return;
        }
        const pickerEnd = content.indexOf('/>', pickerStart);
        const blockEnd = content.indexOf(')}', pickerEnd) + 2;

        if (touchableStart !== -1 && blockEnd !== -1) {
            const originalBlock = content.substring(touchableStart, blockEnd);

            if (originalBlock.includes('setShowDatePicker(true)') && originalBlock.includes('<DatePicker')) {
                const newBlock = `{Platform.OS === 'web' ? (
                                <DatePicker
                                    value={dueDate}
                                    onChange={onDateChange}
                                    minimumDate={new Date()}
                                />
                            ) : (
                                <>
                                    ${originalBlock}
                                </>
                            )}`;

                content = content.replace(originalBlock, newBlock);
                fs.writeFileSync(path, content, 'utf8');
                console.log('Fixed CreateTaskModal');
            } else {
                console.log('Block validation failed for CreateTaskModal');
            }
        }
    } else {
        console.log('Anchor not found in CreateTaskModal');
    }
}

fixTaskDetailModal();
fixCreateTaskModal();
