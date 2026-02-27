# 移动端构建指南 (Mobile Build Guide)

本项目已配置支持 H5、iOS 和 Android 多端发布。

## 1. H5 移动端 (H5 Mobile Web)

本项目本质上是一个响应式的 Web 应用，可以直接部署到任何 Web 服务器。

**构建命令**:
```bash
npm run build
```
构建产物位于 `dist/` 目录，将该目录上传到服务器即可。

**优化项**:
- 已配置 `viewport` 禁止缩放，提供原生 App 般的体验。
- 支持触摸操作。

## 2. 原生 App (iOS & Android) - 使用 Capacitor

本项目集成了 Capacitor (v3)，可以将 Web 应用打包为原生 App。

### 前置要求
- **Android**: 安装 Android Studio。
- **iOS**: 安装 Xcode (仅限 macOS)。

### 构建步骤

1. **构建 Web 资源**:
   每次修改代码后，必须先重新构建 Web 资源：
   ```bash
   npm run build
   ```

2. **同步资源到原生项目**:
   将构建好的 `dist` 目录同步到 `android` 和 `ios` 目录：
   ```bash
   npx cap sync
   ```

3. **打开原生 IDE 进行打包**:

   - **Android**:
     ```bash
     npx cap open android
     ```
     在 Android Studio 中，等待 Gradle 同步完成，然后点击 "Run" 按钮在模拟器运行，或点击 "Build > Build Bundle(s) / APK(s)" 生成 APK。

   - **iOS** (macOS only):
     ```bash
     npx cap open ios
     ```
     在 Xcode 中，选择模拟器或真机，点击 "Run"。要发布到 App Store，请使用 "Product > Archive"。

## 3. 微信小程序 (WeChat Mini Program)

虽然本项目主要针对 Web 和 Capacitor，但可以通过以下方式适配小程序：

1. **使用 WebView**:
   在小程序中创建一个 `<web-view>` 组件，指向部署好的 H5 地址（需配置业务域名）。这是最简单的方式。

2. **使用 Taro/Uni-app 重构 (可选)**:
   如果需要原生小程序体验，建议使用 Taro 或 Uni-app 框架迁移现有的 React 代码。由于本项目是标准的 React + Vite 项目，迁移成本取决于对 DOM/BOM API 的依赖程度。

## 常用命令速查

- `npm run dev`: 启动开发服务器
- `npm run build`: 构建生产环境代码
- `npx cap sync`: 同步 Web 代码到原生项目
- `npx cap open android`: 打开 Android Studio
- `npx cap open ios`: 打开 Xcode
