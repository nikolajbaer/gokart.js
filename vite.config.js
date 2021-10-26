import react from '@vitejs/plugin-react'

const config = {
  root: 'example/',
  plugins: [react()],
  assetsInclude: ['**/*.glb'],
}

// https://vitejs.dev/config/
export default config

