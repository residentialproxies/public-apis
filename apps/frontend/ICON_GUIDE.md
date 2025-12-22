# Icon & Favicon 指南

## 当前实现

项目使用 Next.js 16 的动态图标生成功能：

- `src/app/icon.tsx` - 生成 32x32 favicon
- `src/app/apple-icon.tsx` - 生成 180x180 Apple Touch Icon
- `src/app/favicon.ico` - 静态 fallback

## 优化建议（生产环境）

### 1. 使用专业设计工具

推荐工具：

- **Figma**: 设计矢量图标
- **Favicon Generator**: https://realfavicongenerator.net/
- **Canva**: 快速生成品牌图标

### 2. 尺寸规范

生产环境应提供以下尺寸：

| 文件             | 尺寸                | 用途         |
| ---------------- | ------------------- | ------------ |
| `icon.png`       | 32x32               | 浏览器标签页 |
| `icon.png`       | 192x192             | PWA manifest |
| `apple-icon.png` | 180x180             | iOS 主屏幕   |
| `favicon.ico`    | 16x16, 32x32, 48x48 | 多尺寸 ICO   |

### 3. 品牌视觉建议

**配色方案**（参考当前渐变）：

- 主色：`#667eea` (紫蓝色)
- 次色：`#764ba2` (深紫色)

**图标元素建议**：

- 简洁的字母 "AN" (API Navigator)
- 或使用抽象图形：连接的节点（象征 API）
- 或使用指南针图标（象征 Navigator）

### 4. 替换动态图标为静态文件

步骤：

1. **删除动态生成文件**：

   ```bash
   rm src/app/icon.tsx
   rm src/app/apple-icon.tsx
   ```

2. **添加静态图片**（替换为你的设计）：

   ```bash
   # 放置在 src/app/ 目录
   src/app/icon.png          # 32x32 或 192x192
   src/app/apple-icon.png    # 180x180
   ```

3. **可选：添加多尺寸 manifest icons**：
   ```json
   // public/site.webmanifest
   {
     "name": "API Navigator",
     "short_name": "API Nav",
     "icons": [
       {
         "src": "/icon-192.png",
         "sizes": "192x192",
         "type": "image/png"
       },
       {
         "src": "/icon-512.png",
         "sizes": "512x512",
         "type": "image/png"
       }
     ],
     "theme_color": "#667eea",
     "background_color": "#ffffff",
     "display": "standalone"
   }
   ```

### 5. 验证图标

部署后检查：

- ✅ 浏览器标签页显示图标
- ✅ iOS 添加到主屏幕时显示正确
- ✅ Android PWA 安装时显示正确
- ✅ 社交媒体分享时使用 OG 图片（非 favicon）

### 6. 性能优化

- 使用 PNG 而非 SVG（更好的浏览器兼容性）
- 使用 WebP 格式（如果浏览器支持）
- 压缩图片（使用 TinyPNG / Squoosh）

## 快速生成命令

使用 ImageMagick 批量生成：

```bash
# 从 SVG 生成多尺寸 PNG
convert icon.svg -resize 32x32 icon-32.png
convert icon.svg -resize 192x192 icon-192.png
convert icon.svg -resize 180x180 apple-icon.png

# 生成 ICO 文件（多尺寸）
convert icon-16.png icon-32.png icon-48.png favicon.ico
```

## 相关链接

- [Next.js Metadata Icons](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons)
- [Apple Human Interface Guidelines - App Icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Google PWA Icon Guidelines](https://web.dev/add-manifest/)
- [Favicon Generator](https://realfavicongenerator.net/)
