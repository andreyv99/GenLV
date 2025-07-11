import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-vector-to-graph',
    standalone: true,
    imports: [FormsModule, CommonModule],
    templateUrl: './vector-to-graph.component.html',
    styleUrls: ['./vector-to-graph.component.scss']
})
export class VectorToGraphComponent {
    inputVector: string = '';
    error: string = '';
    showResult: boolean = false;
    nodes: string[] = [];
    nodeCoords: { x: number; y: number }[] = [];
    svgSize = 320;
    nodeColors = ['#e3f2fd', '#ffe0b2', '#c8e6c9', '#fff9c4', '#f8bbd0', '#d1c4e9', '#b2dfdb', '#f0f4c3'];

    get Math() {
        return Math;
    }

    onConvert() {
        this.error = '';
        const len = this.inputVector.length;
        if (!/^[01]+$/.test(this.inputVector) || len < 2 || len > 256) {
            this.error = 'The vector must contain 2-256 digits (0 or 1)';
            this.showResult = false;
            return;
        }
        // Проверка: длина вектора должна быть квадратом целого числа
        const N = Math.sqrt(len);
        if (!Number.isInteger(N)) {
            this.error = 'The vector length must be a perfect square (4, 9, 16, 25, ...)';
            this.showResult = false;
            return;
        }
        const n = Math.ceil(Math.log2(N));
        this.nodes = Array.from({ length: N }, (_, i) => i.toString(2).padStart(n, '0'));
        // Координаты
        if (N === 2) {
            // Для двух вершин — по горизонтали
            const y = this.svgSize / 2;
            this.nodeCoords = [
                { x: this.svgSize / 2 - 60, y },
                { x: this.svgSize / 2 + 60, y }
            ];
        } else {
            // По кругу
            const R = 100;
            const cx = this.svgSize / 2,
                cy = this.svgSize / 2;
            this.nodeCoords = this.nodes.map((_, i, arr) => {
                const angle = (2 * Math.PI * i) / arr.length - Math.PI / 2;
                return { x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) };
            });
        }
        this.showResult = true;
    }

    // Сброс результата при изменении inputVector
    ngOnInit() {}
    ngOnChanges() {
        this.showResult = false;
    }

    // SVG: дуга для петли
    getLoopPath(x: number, y: number, idx: number, total: number, loopRadius: number = 28): string {
        // Смещение петли наружу от центра
        const r = loopRadius;
        // Угол для вершины
        const angle = (2 * Math.PI * idx) / total - Math.PI / 2;
        // Центр петли
        const cx = x + r * Math.cos(angle - Math.PI / 6);
        const cy = y + r * Math.sin(angle - Math.PI / 6);
        // Короткая дуга
        return `M${x} ${y} Q${cx} ${cy} ${x} ${y}`;
    }

    // SVG: точка на окружности радиуса r от центра (x1, y1) в направлении (x2, y2)
    getEdgePoint(x1: number, y1: number, x2: number, y2: number, r: number = 28) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        const ratio = r / len;
        return {
            x: x1 + dx * ratio,
            y: y1 + dy * ratio
        };
    }

    // SVG: выраженная петля сбоку от круга
    getExpressiveLoopPath(x: number, y: number, idx: number, total: number, r: number = 28): string {
        // Угол для вершины
        const angle = (2 * Math.PI * idx) / total - Math.PI / 2;
        // Стартовая точка (на окружности)
        const startX = x + 18 * Math.cos(angle);
        const startY = y + 18 * Math.sin(angle);
        // Перпендикулярный угол (наружу круга)
        const perpAngle = angle - Math.PI / 2;
        // Control points для выраженной петли
        const c1x = startX + r * Math.cos(perpAngle);
        const c1y = startY + r * Math.sin(perpAngle);
        const c2x = startX + r * Math.cos(perpAngle + Math.PI / 3);
        const c2y = startY + r * Math.sin(perpAngle + Math.PI / 3);
        // Конечная точка (почти совпадает со стартовой, но чуть смещена)
        const endX = x + 18 * Math.cos(angle + 0.5);
        const endY = y + 18 * Math.sin(angle + 0.5);
        return `M${startX} ${startY} C${c1x} ${c1y},${c2x} ${c2y},${endX} ${endY}`;
    }
}
