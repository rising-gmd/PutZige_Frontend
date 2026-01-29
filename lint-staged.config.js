module.exports = {
  "*.{ts,js,json,md,html,scss}": ["prettier --write", "git add"],
  "src/**/*.{ts,html,scss}": ["eslint --ext .ts,.html --fix"],
};
