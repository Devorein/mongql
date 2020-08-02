module.exports = {
  hooks: {
    'pre-commit': 'npm run typecheck && lint-staged && npm run test',
    'pre-push': 'npm run lint && npm run test'
  }
};
