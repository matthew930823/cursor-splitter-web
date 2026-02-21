// 洪水填充去背算法
function removeBackgroundFunc(imageData, tolerance = 30) {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  
  // 取得左上角的背景色
  const bgR = data[0];
  const bgG = data[1];
  const bgB = data[2];
  
  // 建立訪問標記陣列
  const visited = new Array(width * height).fill(false);
  
  // BFS 佇列
  const queue = [[0, 0]];
  visited[0] = true;
  
  while (queue.length > 0) {
    const [x, y] = queue.shift();
    const index = (y * width + x) * 4;
    
    // 將當前像素設為透明
    data[index + 3] = 0;
    
    // 檢查四個方向的鄰居
    const neighbors = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1]
    ];
    
    for (const [nx, ny] of neighbors) {
      // 檢查邊界
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      
      const nIndex = ny * width + nx;
      if (visited[nIndex]) continue;
      
      const pixelIndex = (ny * width + nx) * 4;
      const r = data[pixelIndex];
      const g = data[pixelIndex + 1];
      const b = data[pixelIndex + 2];
      
      // 計算顏色差異
      const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
      
      // 如果顏色相近，加入佇列
      if (diff <= tolerance) {
        visited[nIndex] = true;
        queue.push([nx, ny]);
      }
    }
  }
  
  return imageData;
}

// 創建 CUR 檔案
export function createCursorFile(canvas, hotspotX = 0, hotspotY = 0) {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // 建立 BMP 資料（從底部開始）
  const bmpData = [];
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      bmpData.push(data[index + 2]); // B
      bmpData.push(data[index + 1]); // G
      bmpData.push(data[index]); // R
      bmpData.push(data[index + 3]); // A
    }
  }
  
  // 建立 AND mask
  const andMaskSize = Math.ceil((width + 31) / 32) * 4 * height;
  const andMask = new Array(andMaskSize).fill(0);
  
  // 建立 DIB 標頭
  const dibHeader = new ArrayBuffer(40);
  const dibView = new DataView(dibHeader);
  dibView.setUint32(0, 40, true); // 標頭大小
  dibView.setInt32(4, width, true); // 寬度
  dibView.setInt32(8, height * 2, true); // 高度 * 2
  dibView.setUint16(12, 1, true); // 色彩平面數
  dibView.setUint16(14, 32, true); // 每像素位元數
  dibView.setUint32(16, 0, true); // 壓縮方式
  dibView.setUint32(20, 0, true); // 圖片大小
  dibView.setInt32(24, 0, true); // 水平解析度
  dibView.setInt32(28, 0, true); // 垂直解析度
  dibView.setUint32(32, 0, true); // 使用的顏色數
  dibView.setUint32(36, 0, true); // 重要的顏色數
  
  const imageDataSize = new Uint8Array(dibHeader).length + bmpData.length + andMask.length;
  
  // 建立 CUR 檔案標頭
  const header = new ArrayBuffer(6 + 16);
  const headerView = new DataView(header);
  
  // ICONDIR
  headerView.setUint16(0, 0, true); // 保留
  headerView.setUint16(2, 2, true); // 類型：2 = CUR
  headerView.setUint16(4, 1, true); // 圖片數量
  
  // ICONDIRENTRY
  const imageWidth = width < 256 ? width : 0;
  const imageHeight = height < 256 ? height : 0;
  headerView.setUint8(6, imageWidth); // 寬度
  headerView.setUint8(7, imageHeight); // 高度
  headerView.setUint8(8, 0); // 調色盤顏色數
  headerView.setUint8(9, 0); // 保留
  headerView.setUint16(10, hotspotX, true); // 熱點 X
  headerView.setUint16(12, hotspotY, true); // 熱點 Y
  headerView.setUint32(14, imageDataSize, true); // 圖片資料大小
  headerView.setUint32(18, 22, true); // 圖片資料偏移
  
  // 組合所有資料
  const totalSize = 22 + imageDataSize;
  const fileData = new Uint8Array(totalSize);
  
  fileData.set(new Uint8Array(header), 0);
  fileData.set(new Uint8Array(dibHeader), 22);
  fileData.set(new Uint8Array(bmpData), 22 + 40);
  fileData.set(new Uint8Array(andMask), 22 + 40 + bmpData.length);
  
  return new Blob([fileData], { type: 'application/octet-stream' });
}

// 主要的切割函數
export async function splitCursorGrid(
  file,
  rows = 4,
  cols = 4,
  removeBackground = false,
  tolerance = 30
) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    
    reader.onload = (e) => {
      img.src = e.target.result;
    };
    
    img.onload = () => {
      try {
        const width = img.width;
        const height = img.height;
        const cellWidth = Math.floor(width / cols);
        const cellHeight = Math.floor(height / rows);
        
        const cursors = [];
        let index = 0;
        
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            index++;
            
            // 建立 canvas 用於切割
            const canvas = document.createElement('canvas');
            canvas.width = cellWidth;
            canvas.height = cellHeight;
            const ctx = canvas.getContext('2d');
            
            // 裁切圖片
            const left = col * cellWidth;
            const top = row * cellHeight;
            
            ctx.drawImage(
              img,
              left, top, cellWidth, cellHeight,
              0, 0, cellWidth, cellHeight
            );
            
            // 去背處理
            if (removeBackground) {
              const imageData = ctx.getImageData(0, 0, cellWidth, cellHeight);
              const processedData = removeBackgroundFunc(imageData, tolerance);
              ctx.putImageData(processedData, 0, 0);
            }
            
            // 設定熱點座標
            let hotspotX = 0;
            let hotspotY = 0;
            
            // cursor_06 特殊處理
            if (index === 6) {
              hotspotX = Math.floor(cellWidth / 2);
              hotspotY = Math.floor(cellHeight / 2);
            }
            
            // 生成 CUR 檔案
            const curBlob = createCursorFile(canvas, hotspotX, hotspotY);
            const curUrl = URL.createObjectURL(curBlob);
            
            // 生成預覽圖
            const previewUrl = canvas.toDataURL('image/png');
            
            cursors.push({
              index,
              filename: `cursor_${String(index).padStart(2, '0')}.cur`,
              curUrl,
              previewUrl,
              hotspotX,
              hotspotY,
              width: cellWidth,
              height: cellHeight,
              canvas // 保存 canvas 以便重新生成 CUR 文件
            });
          }
        }
        
        resolve(cursors);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('圖片載入失敗'));
    };
    
    reader.onerror = () => {
      reject(new Error('檔案讀取失敗'));
    };
    
    reader.readAsDataURL(file);
  });
}
