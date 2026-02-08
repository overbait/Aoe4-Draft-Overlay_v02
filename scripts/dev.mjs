import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
const filterIndex = args.indexOf('--filter');
let commandArgs;

if (filterIndex !== -1 && args[filterIndex + 1]) {
  const filterValue = args[filterIndex + 1];
  commandArgs = ['--filter', filterValue, 'dev'];
} else {
  commandArgs = ['-r', '--parallel', 'dev'];
}

const child = spawn('pnpm', commandArgs, { stdio: 'inherit' });
child.on('exit', code => {
  process.exit(code ?? 1);
});
