import basicSsl from '@vitejs/plugin-basic-ssl';

export default {
  base: './', // muy importante para rutas relativas en GitHub Pages
  build: {
    outDir: 'dist',
  },
  plugins: [ basicSsl() ],
  server: {
    https: true,
    host: true
  }
};