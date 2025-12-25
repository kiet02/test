import type { Point } from "./types";

export const createBezierPath = (point: Point, nextPoint: Point) => {
  const startX = point.x;
  const startY = point.y;
  const cp1X = point.x + point.rightX;
  const cp1Y = point.y + point.rightY;
  const cp2X = nextPoint.x + nextPoint.leftX;
  const cp2Y = nextPoint.y + nextPoint.leftY;
  const endX = nextPoint.x;
  const endY = nextPoint.y;
  return `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
};

export const getBezierLength = (
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  segments = 100
) => {
  let length = 0;
  let prev = p0;
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const x =
      (1 - t) ** 3 * p0.x +
      3 * (1 - t) ** 2 * t * p1.x +
      3 * (1 - t) * t ** 2 * p2.x +
      t ** 3 * p3.x;
    const y =
      (1 - t) ** 3 * p0.y +
      3 * (1 - t) ** 2 * t * p1.y +
      3 * (1 - t) * t ** 2 * p2.y +
      t ** 3 * p3.y;
    length += Math.hypot(x - prev.x, y - prev.y);
    prev = { x, y };
  }
  return length;
};
// Hàm lấy tọa độ 1 điểm trên đường cong Bezier tại thời điểm t (0 -> 1)
export const getPointOnBezier = (
  t: number,
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number }
) => {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
  };
};

// Hàm tính diện tích
export const calculateCurveArea = (curvePoints: Point[]) => {
  if (curvePoints.length < 2) return 0;

  // 1. Tạo một đa giác xấp xỉ bằng cách lấy mẫu nhiều điểm trên đường cong
  const polygon: { x: number; y: number }[] = [];
  const steps = 20; // Độ phân giải (càng cao càng chính xác, 20 là đủ mượt)

  for (let i = 0; i < curvePoints.length - 1; i++) {
    const p0 = curvePoints[i];
    const p3 = curvePoints[i + 1];

    // Tính toạ độ tuyệt đối của 2 điểm điều khiển (Control Points)
    // p0.right là tay đòn đi ra từ p0
    const p1 = { x: p0.x + p0.rightX, y: p0.y + p0.rightY };
    // p3.left là tay đòn đi vào p3
    const p2 = { x: p3.x + p3.leftX, y: p3.y + p3.leftY };

    for (let j = 0; j < steps; j++) {
      const t = j / steps;
      polygon.push(getPointOnBezier(t, p0, p1, p2, p3));
    }
  }

  // Thêm điểm cuối cùng của đường cong
  const lastPoint = curvePoints[curvePoints.length - 1];
  polygon.push({ x: lastPoint.x, y: lastPoint.y });

  // Đóng kín hình: Nối điểm cuối về điểm đầu (nếu chưa trùng)
  polygon.push({ x: curvePoints[0].x, y: curvePoints[0].y });

  // 2. Dùng công thức Shoelace để tính diện tích đa giác này
  let area = 0;
  for (let i = 0; i < polygon.length - 1; i++) {
    area += polygon[i].x * polygon[i + 1].y;
    area -= polygon[i + 1].x * polygon[i].y;
  }

  return Math.abs(area / 2);
};
// Hàm tính thể tích khối tròn xoay (Giả sử hình vẽ là mặt cắt đường kính)
export const calculateRevolvedVolume = (curvePoints: Point[]) => {
  if (curvePoints.length < 2) return 0;

  // 1. Tạo lại đa giác xấp xỉ (giống hàm tính diện tích cũ)
  const polygon: { x: number; y: number }[] = [];
  const steps = 30; // Tăng độ phân giải để tính thể tích chính xác hơn

  for (let i = 0; i < curvePoints.length - 1; i++) {
    const p0 = curvePoints[i];
    const p3 = curvePoints[i + 1];
    const p1 = { x: p0.x + p0.rightX, y: p0.y + p0.rightY };
    const p2 = { x: p3.x + p3.leftX, y: p3.y + p3.leftY };

    for (let j = 0; j < steps; j++) {
      const t = j / steps;
      polygon.push(getPointOnBezier(t, p0, p1, p2, p3));
    }
  }
  // Thêm điểm cuối và đóng vòng (nếu cần, nhưng scanline không bắt buộc đóng vòng)
  const lastPoint = curvePoints[curvePoints.length - 1];
  polygon.push({ x: lastPoint.x, y: lastPoint.y });

  // 2. Tìm giới hạn trên và dưới (Bounding Box theo trục Y)
  let minY = Infinity;
  let maxY = -Infinity;
  polygon.forEach((p) => {
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });

  // 3. Thực hiện thuật toán Scanline (Cắt lát)
  let totalVolume = 0;
  const dy = 1; // Độ dày mỗi lát cắt là 1px (Càng nhỏ càng chính xác nhưng chậm hơn)

  // Duyệt từ trên xuống dưới
  for (let y = minY; y <= maxY; y += dy) {
    const intersections: number[] = [];

    // Tìm giao điểm của dòng kẻ ngang y với các cạnh của đa giác
    for (let i = 0; i < polygon.length - 1; i++) {
      const p1 = polygon[i];
      const p2 = polygon[i + 1];

      // Kiểm tra xem dòng y có cắt qua cạnh p1-p2 không
      if ((p1.y <= y && p2.y > y) || (p2.y <= y && p1.y > y)) {
        // Tính toạ độ x của giao điểm
        const t = (y - p1.y) / (p2.y - p1.y);
        const intersectX = p1.x + t * (p2.x - p1.x);
        intersections.push(intersectX);
      }
    }

    // Sắp xếp các giao điểm từ trái sang phải
    intersections.sort((a, b) => a - b);

    // Tính bề rộng (Diameter) tại độ cao y
    // Giả sử hình vẽ là 1 khối liền, ta lấy điểm xa nhất trừ điểm gần nhất
    if (intersections.length >= 2) {
      const width = intersections[intersections.length - 1] - intersections[0];

      // Công thức: V_lát = (pi * D^2 / 4) * dy
      const sliceArea = (Math.PI * width * width) / 4;
      totalVolume += sliceArea * dy;
    }
  }

  return totalVolume;
};
