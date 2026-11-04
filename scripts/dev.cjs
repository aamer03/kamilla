const path = require('node:path');
const { execFileSync } = require('node:child_process');
const browserSync = require('browser-sync').create();

const root = path.resolve(__dirname, '..');
let rebuildTimer;

function build() {
  // A fresh process picks up changes to templates, translations and renderer code.
  execFileSync(process.execPath, [path.join(__dirname, 'build.cjs')], {
    cwd: root,
    stdio: 'inherit',
  });
}

build();

browserSync.init(
  {
    server: path.join(root, 'dist'),
    listen: '127.0.0.1',
    port: 3000,
    open: false,
    online: false,
    ui: false,
    notify: false,
    ghostMode: false,
  },
  (error) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }

    browserSync
      .watch(['src/**/*', 'assets/**/*', 'scripts/build.cjs'], {
        cwd: root,
        ignoreInitial: true,
        awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 },
      })
      .on('all', () => {
        clearTimeout(rebuildTimer);
        rebuildTimer = setTimeout(() => {
          try {
            build();
            browserSync.reload();
          } catch {
            console.error('Build failed. Fix the error and save to try again.');
          }
        }, 100);
      });

    console.log('Edit src/ or assets/ and save to rebuild and refresh.');
    console.log('Press Ctrl+C to stop the local preview.');
  },
);
