import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // 使用正则表达式将 'react-syntax-highlighter' 及其所有子路径
      // (例如 '.../dist/esm/styles/prism') 声明为外部依赖。
      // 这是一个更可靠的方法，可以确保构建工具不会尝试打包这些模块。
      // 浏览器将使用 index.html 中的 importmap 从 CDN 加载它们。
      external: [
        /^react-syntax-highlighter(\/.*)?/,
      ]
    }
  }
})
