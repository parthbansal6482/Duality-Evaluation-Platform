const { spawn } = require('child_process');
const path = require('path');

function runWithMode(targetScript, modeFlag) {
    const targetPath = path.join(__dirname, targetScript);
    const child = spawn(process.execPath, [targetPath, modeFlag], {
        stdio: 'inherit',
    });

    child.on('exit', (code) => {
        process.exit(code ?? 0);
    });

    child.on('error', (err) => {
        console.error(`Failed to run ${targetScript}:`, err.message);
        process.exit(1);
    });
}

module.exports = { runWithMode };
