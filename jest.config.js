module.exports = {
  verbose: true,
  moduleFileExtensions: ["js", "jsx","ts","tsx"],
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
  },
  transformIgnorePatterns: [
    "/node_modules/(^three/examples/jsm|@dimforge).*"
  ]
};
