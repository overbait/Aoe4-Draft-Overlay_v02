import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const main = () => {
  const args = process.argv.slice(2);
  const filterIndex = args.indexOf('--filter');
  const rootDir = dirname(fileURLToPath(import.meta.url));

  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

  const hasPnpm = () => {
    const result = spawnSync(pnpmCommand, ['--version'], { stdio: 'ignore' });
    return result.status === 0;
  };

  const packageDirectoryMap = new Map([
    ['@aoe4/backend', 'apps/backend'],
    ['@aoe4/desktop', 'apps/desktop'],
    ['@aoe4/overlay', 'apps/overlay'],
  ]);

  const npmInstall = targetDir => {
    const result = spawnSync(npmCommand, ['install', '--prefix', join(rootDir, '..', targetDir)], {
      stdio: 'inherit',
    });
    return result.status === 0;
  };

  if (filterIndex !== -1 && args[filterIndex + 1]) {
    const filterValue = args[filterIndex + 1];
    if (hasPnpm()) {
      const commandArgs = ['--filter', filterValue, 'dev'];
      const child = spawn(pnpmCommand, commandArgs, { stdio: 'inherit' });
      child.on('exit', code => process.exit(code ?? 1));
      process.on('SIGINT', () => child.kill('SIGINT'));
      process.on('SIGTERM', () => child.kill('SIGTERM'));
      return;
    }
    const target = packageDirectoryMap.get(filterValue);
    if (!target) {
      console.error(`Unknown filter "${filterValue}". Install pnpm or use a known package filter.`);
      process.exit(1);
    }
    const child = spawn(npmCommand, ['run', 'dev', '--prefix', join(rootDir, '..', target)], { stdio: 'inherit' });
    child.on('exit', code => process.exit(code ?? 1));
    process.on('SIGINT', () => child.kill('SIGINT'));
    process.on('SIGTERM', () => child.kill('SIGTERM'));
    return;
  }

  if (hasPnpm()) {
    const child = spawn(pnpmCommand, ['-r', '--parallel', 'dev'], { stdio: 'inherit' });
    child.on('exit', code => process.exit(code ?? 1));
    process.on('SIGINT', () => child.kill('SIGINT'));
    process.on('SIGTERM', () => child.kill('SIGTERM'));
    return;
  }

  const backendInstallOk = npmInstall('apps/backend');
  const desktopInstallOk = npmInstall('apps/desktop');
  if (!backendInstallOk || !desktopInstallOk) {
    process.exit(1);
  }

  const backend = spawn(npmCommand, ['run', 'dev', '--prefix', join(rootDir, '..', 'apps/backend')], { stdio: 'inherit' });
  const desktop = spawn(npmCommand, ['run', 'dev', '--prefix', join(rootDir, '..', 'apps/desktop')], { stdio: 'inherit' });

  let exitCode = 0;
  const onExit = code => {
    if (typeof code === 'number' && code !== 0) {
      exitCode = code;
    }
  };

  backend.on('exit', onExit);
  desktop.on('exit', onExit);

  const shutdown = () => {
    backend.kill('SIGINT');
    desktop.kill('SIGINT');
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('exit', () => process.exit(exitCode || 0));
};

main();
