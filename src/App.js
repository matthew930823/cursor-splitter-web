import React, { useState } from 'react';
import { splitCursorGrid, createCursorFile } from './utils/cursorUtils';
import { getTranslation } from './i18n';
import './App.css';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [removeBackground, setRemoveBackground] = useState(false);
  const [tolerance, setTolerance] = useState(30);
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(4);
  const [cursors, setCursors] = useState([]);
  const [language, setLanguage] = useState('zh-TW');
  const [showHotspotGuide, setShowHotspotGuide] = useState(true);

  const t = (key) => getTranslation(language, key);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setCursors([]);
    }
  };

  const handleProcess = async () => {
    if (!selectedFile) {
      alert(t('alertSelectImage'));
      return;
    }

    setProcessing(true);
    try {
      const result = await splitCursorGrid(
        selectedFile,
        rows,
        cols,
        removeBackground,
        tolerance
      );
      setCursors(result);
    } catch (error) {
      alert(t('alertProcessError') + ': ' + error.message);
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = (cursor) => {
    // 使用當前的熱點座標重新生成 CUR 檔案
    const curBlob = createCursorFile(
      cursor.canvas,
      cursor.hotspotX,
      cursor.hotspotY
    );
    const curUrl = URL.createObjectURL(curBlob);
    
    const link = document.createElement('a');
    link.href = curUrl;
    link.download = cursor.filename;
    link.click();
    
    // 清理臨時 URL
    setTimeout(() => URL.revokeObjectURL(curUrl), 100);
  };

  const handleDownloadPNG = (cursor) => {
    // 下載 PNG 格式
    const link = document.createElement('a');
    link.href = cursor.previewUrl;
    link.download = cursor.filename.replace('.cur', '.png');
    link.click();
  };

  const handleDownloadAll = () => {
    cursors.forEach((cursor, index) => {
      setTimeout(() => {
        handleDownload(cursor);
      }, index * 100);
    });
  };

  const handleDownloadAllPNG = () => {
    cursors.forEach((cursor, index) => {
      setTimeout(() => {
        handleDownloadPNG(cursor);
      }, index * 100);
    });
  };

  const handleHotspotClick = (cursorIndex, event) => {
    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // 計算實際的熱點座標（考慮圖片縮放）
    const scaleX = event.target.naturalWidth / rect.width;
    const scaleY = event.target.naturalHeight / rect.height;
    const hotspotX = Math.round(x * scaleX);
    const hotspotY = Math.round(y * scaleY);
    
    // 更新該游標的熱點座標
    setCursors(prevCursors => 
      prevCursors.map(cursor => 
        cursor.index === cursorIndex
          ? { ...cursor, hotspotX, hotspotY }
          : cursor
      )
    );
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div>
            <h1>{t('title')}</h1>
            <p>{t('subtitle')}</p>
          </div>
          <div className="language-switcher">
            <button 
              className={language === 'zh-TW' ? 'active' : ''} 
              onClick={() => setLanguage('zh-TW')}
            >
              繁中
            </button>
            <button 
              className={language === 'en' ? 'active' : ''} 
              onClick={() => setLanguage('en')}
            >
              EN
            </button>
            <button 
              className={language === 'ja' ? 'active' : ''} 
              onClick={() => setLanguage('ja')}
            >
              日本語
            </button>
          </div>
        </div>
      </header>

      <div className="container">
        <div className="upload-section">
          <div className="file-input-wrapper">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              id="file-input"
            />
            <label htmlFor="file-input" className="file-input-label">
              {t('selectImage')}
            </label>
            {selectedFile && (
              <span className="file-name">{selectedFile.name}</span>
            )}
          </div>

          {previewUrl && (
            <div className="preview">
              <img src={previewUrl} alt="預覽" />
            </div>
          )}
        </div>

        <div className="settings-section">
          <h2>{t('settings')}</h2>

          <div className="setting-group">
            <label>
              {t('rows')}:
              <input
                type="number"
                value={rows}
                onChange={(e) => setRows(parseInt(e.target.value))}
                min="1"
                max="10"
              />
            </label>
          </div>

          <div className="setting-group">
            <label>
              {t('cols')}:
              <input
                type="number"
                value={cols}
                onChange={(e) => setCols(parseInt(e.target.value))}
                min="1"
                max="10"
              />
            </label>
          </div>

          <div className="setting-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={removeBackground}
                onChange={(e) => setRemoveBackground(e.target.checked)}
              />
              {t('enableBgRemoval')}
            </label>
          </div>

          {removeBackground && (
            <div className="setting-group">
              <label>
                {t('tolerance')}:
                <input
                  type="range"
                  value={tolerance}
                  onChange={(e) => setTolerance(parseInt(e.target.value))}
                  min="0"
                  max="255"
                />
                <span className="tolerance-value">{tolerance}</span>
              </label>
            </div>
          )}

          <button
            onClick={handleProcess}
            disabled={!selectedFile || processing}
            className="process-btn"
          >
            {processing ? t('processing') : t('startProcess')}
          </button>
        </div>

        {cursors.length > 0 && (
          <div className="results-section">
            {showHotspotGuide && (
              <div className="hotspot-guide">
                <div className="hotspot-guide-header">
                  <h3>{t('hotspotGuide')}</h3>
                  <button 
                    className="close-guide-btn" 
                    onClick={() => setShowHotspotGuide(false)}
                  >
                    ✕
                  </button>
                </div>
                <p>{t('hotspotGuideText')}</p>
                <div className="guide-visual">
                  <span className="guide-icon">👆</span>
                  <span className="guide-text">{t('clickToSetHotspot')}</span>
                </div>
              </div>
            )}
            <div className="results-header">
              <h2>{t('results')} ({cursors.length} {t('cursors')})</h2>
              <div className="download-buttons">
                <button onClick={handleDownloadAll} className="download-all-btn">
                  {t('downloadAll')}
                </button>
                <button onClick={handleDownloadAllPNG} className="download-all-btn png-btn">
                  {t('downloadAllPNG')}
                </button>
              </div>
            </div>

            <div className="cursors-grid">
              {cursors.map((cursor) => (
                <div key={cursor.index} className="cursor-item">
                  <div className="cursor-preview-wrapper">
                    <img 
                      src={cursor.previewUrl} 
                      alt={cursor.filename}
                      onClick={(e) => handleHotspotClick(cursor.index, e)}
                      className="cursor-preview-image"
                      title={t('clickToSetHotspot')}
                    />
                    <div 
                      className="hotspot-marker"
                      style={{
                        left: `${(cursor.hotspotX / cursor.width) * 100}%`,
                        top: `${(cursor.hotspotY / cursor.height) * 100}%`
                      }}
                    >
                      <div className="hotspot-crosshair"></div>
                    </div>
                  </div>
                  <div className="cursor-info">
                    <span className="cursor-name">{cursor.filename}</span>
                    <span className="hotspot-coords">
                      {t('hotspot')}: ({cursor.hotspotX}, {cursor.hotspotY})
                    </span>
                    <div className="button-group">
                      <button
                        onClick={() => handleDownload(cursor)}
                        className="download-btn"
                      >
                        {t('download')}
                      </button>
                      <button
                        onClick={() => handleDownloadPNG(cursor)}
                        className="download-btn png-btn"
                      >
                        {t('downloadPNG')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="App-footer">
        <p>{t('supportedFormats')}</p>
        <p>{t('hotspotInstruction')}</p>
      </footer>
    </div>
  );
}

export default App;
