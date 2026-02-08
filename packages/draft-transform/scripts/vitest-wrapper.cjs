const { spawnSync } = require('node:child_process');

const rawArgs = process.argv.slice(2);
const cleanedArgs = [];

for (let i = 0; i < rawArgs.length; i += 1) {
  const arg = rawArgs[i];
  if (arg === '--filter') {
    i += 1;
    continue;
  }
  cleanedArgs.push(arg);
}

const vitestCli = require.resolve('vitest/dist/cli.js');
const result = spawnSync(process.execPath, [vitestCli, 'run', ...cleanedArgs], {
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
