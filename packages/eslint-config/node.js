/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ['./index.js'],
  env: {
    node: true,
  },
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
  },
};

