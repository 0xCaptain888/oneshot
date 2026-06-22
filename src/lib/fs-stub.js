// Browser stub for Node.js `fs` module.
// Particle SDK tries to destructure `fs.promises.writeFile` etc.,
// so we provide no-op stubs to prevent crashes.

const noop = () => {};
const noopAsync = () => Promise.resolve();

const promises = {
  readFile: noopAsync,
  writeFile: noopAsync,
  readdir: noopAsync,
  stat: noopAsync,
  mkdir: noopAsync,
  unlink: noopAsync,
  rmdir: noopAsync,
  access: noopAsync,
  copyFile: noopAsync,
  rename: noopAsync,
};

module.exports = {
  readFileSync: noop,
  writeFileSync: noop,
  existsSync: () => false,
  mkdirSync: noop,
  readdirSync: () => [],
  statSync: () => ({}),
  unlinkSync: noop,
  rmdirSync: noop,
  accessSync: noop,
  copyFileSync: noop,
  renameSync: noop,
  promises,
};
