import { useMemo } from 'react';
import assets from '../config/assets';

// ==================== 斜视角农田配置 ====================
const DIRT_AREA = {
  topLeft:     { x: 30.79, y: 48.2 },
  topRight:    { x: 88.91, y: 48.2 },
  bottomLeft:  { x: 6.09,  y: 82.2 },
  bottomRight: { x: 64.21, y: 82.2 },
};

const GRID_ROWS = 4;
const GRID_COLS = 8;
const TILE_FILL = 0.85;
const SKEW_ANGLE = -44;
const SKEW_TAN = Math.tan(Math.abs(SKEW_ANGLE) * Math.PI / 180);

/**
 * 农田网格计算 hook
 * 计算所有格子的位置、尺寸、排序
 */
export default function useFarmGrid(plots) {
  // 建立 row_idx,col_idx → plot 的映射
  const plotMap = useMemo(() => {
    const map = {};
    plots.forEach(p => { map[`${p.row_idx}-${p.col_idx}`] = p; });
    return map;
  }, [plots]);

  // 计算第 row 行的左右边界
  const getRowEdge = (row) => {
    const { topLeft, topRight, bottomLeft, bottomRight } = DIRT_AREA;
    const t = row / GRID_ROWS;
    return {
      leftX:  topLeft.x + (bottomLeft.x - topLeft.x) * t,
      rightX: topRight.x + (bottomRight.x - topRight.x) * t,
      y:      topLeft.y + (bottomLeft.y - topLeft.y) * t,
    };
  };

  // 计算格子 (row, col) 的中心位置和尺寸
  const getPlotGeometry = (row, col) => {
    const topEdge = getRowEdge(row);
    const bottomEdge = getRowEdge(row + 1);

    const centerY = (topEdge.y + bottomEdge.y) / 2;
    const centerLeftX = (topEdge.leftX + bottomEdge.leftX) / 2;
    const centerRightX = (topEdge.rightX + bottomEdge.rightX) / 2;

    const colT = (col + 0.5) / GRID_COLS;
    const centerX = centerLeftX + (centerRightX - centerLeftX) * colT;

    const rowWidth = centerRightX - centerLeftX;
    const tileW = (rowWidth / GRID_COLS) * TILE_FILL;

    const rowHeight = bottomEdge.y - topEdge.y;
    const tileH = rowHeight * TILE_FILL;

    const skewOffsetX = (tileH / 2) * SKEW_TAN;
    const rowOffsetX = (row + 1) * 0.25 * tileW;

    return { centerX: centerX - skewOffsetX + rowOffsetX, centerY, tileW, tileH };
  };

  // 生成固定 4×8 网格
  const sortedPlots = useMemo(() => {
    const grid = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const dbPlot = plotMap[`${r}-${c}`];
        grid.push(dbPlot
          ? { ...dbPlot, row: r, col: c }
          : { id: `empty-${r}-${c}`, row_idx: r, col_idx: c, row: r, col: c, crop_id: null, is_watered: false, is_ready: false, growth_stage: 0 }
        );
      }
    }
    return grid.sort((a, b) => a.row - b.row || a.col - b.col);
  }, [plotMap]);

  return { sortedPlots, getPlotGeometry, GRID_ROWS, GRID_COLS };
}
