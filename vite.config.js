import { defineConfig } from 'vite'

export default defineConfig({
    // This ensures assets are loaded via relative paths. 
    // It's required for GitHub Pages since the URL will be like username.github.io/repo-name/
    base: './'
})
