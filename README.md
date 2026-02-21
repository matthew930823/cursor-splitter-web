# 🖱️ 游標切割工具 - Web 版本

將 4x4 圖片切割並匯出為 Windows 游標檔案 (.cur)

## 功能特點

- ✅ 支援多種圖片格式（PNG、JPG、JPEG、BMP、GIF）
- ✅ 自動切割 4x4 網格（可自訂列數和行數）
- ✅ 洪水填充去背功能
- ✅ 可調整去背容差值
- ✅ 自動生成 .cur 游標檔案
- ✅ 即時預覽
- ✅ 批次下載

## 安裝與執行

### 安裝依賴
```bash
npm install
```

### 啟動開發伺服器
```bash
npm start
```

瀏覽器會自動開啟 http://localhost:3000

### 建置正式版本
```bash
npm run build
```

## 使用方式

1. **選擇圖片**
   - 點選「選擇圖片」按鈕上傳圖片
   - 支援的格式：PNG、JPG、JPEG、BMP、GIF

2. **調整設定**
   - 設定列數和行數（預設 4x4）
   - 啟用去背功能（可選）
   - 調整去背容差值（0-255）

3. **開始切割**
   - 點選「開始切割」按鈕
   - 等待處理完成

4. **下載游標**
   - 單獨下載每個游標檔案
   - 或點選「下載全部」批次下載

## 技術說明

### 去背算法
使用**洪水填充（Flood Fill）**算法：
- 從左上角開始
- 使用 BFS（廣度優先搜尋）
- 只移除與邊界相連的背景色
- 保留物體內部的相同顏色

### 游標熱點
- 預設：左上角 (0, 0)
- cursor_06：中心點（適合輸入游標）

### CUR 檔案格式
符合 Windows ICO/CUR 規格：
- RGBA 32-bit 圖片
- AND mask 支援
- 自訂熱點座標

## 專案結構

```
cursor-splitter-web/
├── public/
│   └── index.html
├── src/
│   ├── utils/
│   │   └── cursorUtils.js    # 核心邏輯
│   ├── App.js                # 主要組件
│   ├── App.css               # 樣式
│   └── index.js              # 入口點
├── package.json
└── README.md
```

## 瀏覽器相容性

- Chrome / Edge (推薦)
- Firefox
- Safari

需要支援 Canvas API 和 File API。

## 授權

MIT License
