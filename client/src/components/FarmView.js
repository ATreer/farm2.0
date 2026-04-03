import React from 'react';
import { t } from '../services/i18n';
import assets from '../config/assets';
import IsoPlot from './IsoPlot';
import SeedPanel from './SeedPanel';
import CropInfoPanel from './CropInfoPanel';
import useFarmData from '../hooks/useFarmData';
import useFarmGrid from '../hooks/useFarmGrid';
import useFarmActions from '../hooks/useFarmActions';

export default function FarmView({ playerId, player, notify, refresh, emitParticle, lang }) {
  const { plots, cropsMap, seeds, reload } = useFarmData(playerId, refresh);
  const { sortedPlots, getPlotGeometry, GRID_ROWS, GRID_COLS } = useFarmGrid(plots);
  const {
    selectedPlot, selectedCrop, animatingPlots,
    seedPanelVisible, seedPanelPos, dragOverPlot,
    setSeedPanelVisible,
    handlePlotClick, handleSeedPlant,
    handleDragOver, handleDragLeave, handleDrop,
    handleWaterAll, handleHarvestAll, getPlotEmoji,
    clearSelection,
  } = useFarmActions(playerId, cropsMap, emitParticle, notify, reload, lang);

  return (
    <div className="farm-container iso-farm-container">
      {/* 农田格子层 */}
      <div className="farm-grid-wrapper iso-farm-wrapper">
        <div className="iso-plots-layer">
          {sortedPlots.map(plot => {
            const { centerX, centerY, tileW, tileH } = getPlotGeometry(plot.row, plot.col);
            return (
              <div
                key={plot.id}
                className={`iso-plot-wrapper ${dragOverPlot === plot.id ? 'drag-over' : ''}`}
                style={{
                  left: `${centerX}%`, top: `${centerY}%`,
                  width: `${tileW}%`, height: `${tileH}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: plot.row * GRID_COLS + plot.col + 1,
                }}
                onClick={(e) => handlePlotClick(plot, e)}
                onDragOver={(e) => handleDragOver(e, plot)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, plot)}
              >
                <IsoPlot
                  plot={plot}
                  emoji={getPlotEmoji(plot)}
                  isAnimating={animatingPlots.has(plot.id)}
                  onClick={(e) => handlePlotClick(plot, e)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="iso-quick-actions">
        <button className="btn btn-blue btn-small" onClick={handleWaterAll}>{assets.btn.waterAll} {t('waterAll', lang)}</button>
        <button className="btn btn-gold btn-small" onClick={handleHarvestAll}>{assets.btn.harvestAll} {t('harvestAll', lang)}</button>
      </div>

      {/* 作物信息 */}
      <CropInfoPanel selectedCrop={selectedCrop} selectedPlot={selectedPlot} lang={lang} onClose={clearSelection} />

      {/* 种子悬浮框 */}
      <SeedPanel
        seeds={seeds}
        cropsMap={cropsMap}
        visible={seedPanelVisible}
        position={seedPanelPos}
        onClose={() => setSeedPanelVisible(false)}
        onPlant={handleSeedPlant}
        lang={lang}
      />
    </div>
  );
}
