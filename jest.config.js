module.exports = {
  verbose: true,
  moduleFileExtensions: ["js", "jsx","ts","tsx"],
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "esbuild-jest",
  },
  transformIgnorePatterns: [
    "/node_modules/(^three/examples/jsm|@dimforge).*"
  ]
}
