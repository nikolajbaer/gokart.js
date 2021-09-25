const esbuild = require('esbuild')
const fs = require('fs')
const path = require('path')
const mode = process.argv[2]

console.log("Building for mode " + mode)

const index_file = path.join(__dirname,'examples/src/index.html')
const dist_index = path.join(__dirname,'dist/index.html')

// Base config for esbuild
const config = {
    entryPoints: ['examples/src/index.jsx'],
    bundle: true,
    outfile: 'dist/out.js',
    sourcemap: true,
    minify: true,
    external: ['require', 'fs', 'path'],
    loader: { 
      '.glb': 'file',
      '.mp3': 'file',
    },
}

// DEV build with watch
if(mode == "dev"){
  fs.copyFile(index_file,dist_index, () => console.log("index.html updated"))
  config.watch = {
    onRebuild(error, result) {
      if (error) console.error('watch build failed:', error)
      else console.error('watch build succeeded:', result)
      fs.copyFile(index_file,dist_index, () => console.log("index.html updated")) // todo figure out how to move this file automatically
    } 
  }
  esbuild.build(config).catch(() => process.exit(1))

  console.log("launching server at http://0.0.0.0:8080/")
  esbuild.serve({
      servedir: './dist', 
      port: 8080, 
      host: '0.0.0.0',
      onRequest: args => console.log(args)
  }, {})

// DEPLOY
} else if(mode == "deploy"){
  fs.copyFile(index_file,dist_index, () => console.log("index.html updated"))
  config.minify = true
  esbuild.build(config).catch(() => process.exit(1))
}
