/**
 * SVG 다운로드 유틸리티
 * SVG 요소를 파일로 저장하는 기능 제공
 */

/**
 * SVG 요소의 스타일을 인라인으로 복사
 * 외부 CSS 의존성 제거를 위해 필요
 */
function inlineStyles(element: Element): void {
  const computedStyle = window.getComputedStyle(element);
  const importantStyles = [
    'fill',
    'stroke',
    'stroke-width',
    'stroke-opacity',
    'fill-opacity',
    'font-family',
    'font-size',
    'font-weight',
    'text-anchor',
    'dominant-baseline',
  ];

  importantStyles.forEach((style) => {
    const value = computedStyle.getPropertyValue(style);
    if (value) {
      (element as HTMLElement).style.setProperty(style, value);
    }
  });

  // 자식 요소들도 재귀적으로 처리
  Array.from(element.children).forEach((child) => inlineStyles(child));
}

/**
 * SVG 요소를 SVG 파일로 다운로드
 * @param svgElement - 다운로드할 SVG 요소
 * @param filename - 파일명 (확장자 제외)
 */
export function downloadSvg(svgElement: SVGSVGElement, filename: string): void {
  // 1. SVG 요소 복제 (원본 보존)
  const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;

  // 2. 스타일 인라인화
  inlineStyles(clonedSvg);

  // 3. xmlns 속성 추가 (독립 SVG 파일용)
  clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  // 4. 배경 추가 (투명 배경 방지)
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('width', '100%');
  rect.setAttribute('height', '100%');
  rect.setAttribute('fill', 'white');
  clonedSvg.insertBefore(rect, clonedSvg.firstChild);

  // 5. Blob 생성 및 다운로드
  const svgData = new XMLSerializer().serializeToString(clonedSvg);
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * SVG 요소를 PNG 파일로 변환하여 다운로드
 * @param svgElement - 다운로드할 SVG 요소
 * @param filename - 파일명 (확장자 제외)
 * @param scale - 해상도 배율 (기본 2x)
 */
export async function downloadSvgAsPng(
  svgElement: SVGSVGElement,
  filename: string,
  scale: number = 2
): Promise<void> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  // SVG 복제 및 스타일 인라인화
  const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
  inlineStyles(clonedSvg);
  clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  // 배경 추가
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('width', '100%');
  rect.setAttribute('height', '100%');
  rect.setAttribute('fill', 'white');
  clonedSvg.insertBefore(rect, clonedSvg.firstChild);

  const svgData = new XMLSerializer().serializeToString(clonedSvg);
  const img = new Image();

  return new Promise((resolve, reject) => {
    img.onload = () => {
      const width = svgElement.clientWidth || parseInt(svgElement.getAttribute('width') || '400');
      const height =
        svgElement.clientHeight || parseInt(svgElement.getAttribute('height') || '400');

      canvas.width = width * scale;
      canvas.height = height * scale;
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Failed to create blob'));
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${filename}.png`;
          link.click();
          URL.revokeObjectURL(url);
          resolve();
        },
        'image/png',
        1.0
      );
    };

    img.onerror = () => reject(new Error('Failed to load SVG as image'));
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  });
}
