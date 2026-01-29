module.exports = {
  "*.{ts,js,json,md,html,scss}": ["prettier --write"],
  "src/**/*.{ts,html,scss}": ["eslint --ext .ts,.html --fix"],
};