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
    nodeColors = ['#e3f2fd', '#ffe0b2', '#c8e6c9', '#fff9c4', '#f8bbd9', '#d1c4e9', '#b2dfdb', '#f0f4c3'];
    
    // Новые свойства для двудольных графов
    isBipartite: boolean = false;
    leftPartition: string[] = [];
    rightPartition: string[] = [];
    bipartiteLayout: boolean = false;
    // Разбиение по индексам вершин: 0 = левая доля (U), 1 = правая доля (V), -1 = неизвестно
    partitionByIndex: number[] = [];

    get Math() {
        return Math;
    }

    onConvert() {
        this.error = '';
        const len = this.inputVector.length;
        if (!/^[01]+$/.test(this.inputVector) || len < 2 || len > 256) {
            this.error = 'The vector length must contain 2-256 digits (0 or 1)';
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
        
        // Проверяем, является ли граф двудольным
        this.checkBipartite();
        
        // Генерируем координаты в зависимости от типа графа
        this.generateCoordinates();
        
        this.showResult = true;
    }

    // Проверка двудольности графа
    private checkBipartite() {
        const N = this.nodes.length;
        const directed = this.buildAdjacencyMatrix();
        const adjacencyMatrix = this.buildUndirectedNoLoopAdjacency(directed);
        
        // Используем BFS для проверки двудольности (по неориентированной матрице без петель)
        const colors = new Array(N).fill(-1); // -1 = не посещена, 0/1 = цвета
        let isBipartite = true;
        
        for (let start = 0; start < N && isBipartite; start++) {
            if (colors[start] === -1) {
                isBipartite = this.bfsCheckBipartite(adjacencyMatrix, start, colors);
            }
        }
        
        // Если нет межвершинных рёбер (только изоляция и/или петли), распределяем вершины попеременно для лучшего отображения
        const hasCrossEdges = (() => {
            for (let i = 0; i < N; i++) {
                for (let j = i + 1; j < N; j++) {
                    if (adjacencyMatrix[i][j]) return true;
                }
            }
            return false;
        })();
        if (isBipartite && !hasCrossEdges) {
            for (let i = 0; i < N; i++) colors[i] = i % 2;
        }
        
        this.isBipartite = isBipartite;
        this.partitionByIndex = colors.slice();
        
        if (this.isBipartite) {
            // Разделяем вершины на две части
            this.leftPartition = [];
            this.rightPartition = [];
            for (let i = 0; i < N; i++) {
                if (this.partitionByIndex[i] === 0) {
                    this.leftPartition.push(this.nodes[i]);
                } else if (this.partitionByIndex[i] === 1) {
                    this.rightPartition.push(this.nodes[i]);
                }
            }
            this.bipartiteLayout = true;
        } else {
            this.bipartiteLayout = false;
            this.leftPartition = [];
            this.rightPartition = [];
        }
    }

    // BFS для проверки двудольности
    private bfsCheckBipartite(adjacencyMatrix: boolean[][], start: number, colors: number[]): boolean {
        const queue: number[] = [start];
        colors[start] = 0;
        
        while (queue.length > 0) {
            const current = queue.shift()!;
            
            for (let neighbor = 0; neighbor < adjacencyMatrix.length; neighbor++) {
                if (!adjacencyMatrix[current][neighbor]) continue;
                // Петли не нарушают двудольность, пропускаем их
                if (neighbor === current) continue;
                if (colors[neighbor] === -1) {
                    colors[neighbor] = 1 - colors[current];
                    queue.push(neighbor);
                } else if (colors[neighbor] === colors[current]) {
                    return false; // Конфликт цветов
                }
            }
        }
        
        return true;
    }

    // Построение матрицы смежности
    private buildAdjacencyMatrix(): boolean[][] {
        const N = this.nodes.length;
        const matrix: boolean[][] = Array(N).fill(null).map(() => Array(N).fill(false));
        
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                if (this.inputVector[i * N + j] === '1') {
                    matrix[i][j] = true;
                }
            }
        }
        
        return matrix;
    }

    // Неориентированная матрица без петель: A[i][j] = A[j][i] = true, если существует ребро i→j или j→i, i != j
    private buildUndirectedNoLoopAdjacency(directed: boolean[][]): boolean[][] {
        const N = directed.length;
        const undirected: boolean[][] = Array(N).fill(null).map(() => Array(N).fill(false));
        for (let i = 0; i < N; i++) {
            for (let j = i + 1; j < N; j++) {
                if (directed[i][j] || directed[j][i]) {
                    undirected[i][j] = true;
                    undirected[j][i] = true;
                }
            }
        }
        return undirected;
    }

    // Генерация координат для вершин
    private generateCoordinates() {
        const N = this.nodes.length;
        
        if (this.bipartiteLayout) {
            // Двудольный граф: две колонки
            this.generateBipartiteCoordinates();
        } else if (N === 2) {
            // Для двух вершин — по горизонтали
            const y = this.svgSize / 2;
            this.nodeCoords = [
                { x: this.svgSize / 2 - 60, y },
                { x: this.svgSize / 2 + 60, y }
            ];
        } else {
            // По кругу для обычных графов
            this.generateCircularCoordinates();
        }
    }

    // Координаты для двудольного графа (по индексам)
    private generateBipartiteCoordinates() {
        const N = this.nodes.length;
        const leftCount = this.partitionByIndex.filter(p => p === 0).length;
        const rightCount = this.partitionByIndex.filter(p => p === 1).length;
        
        // Левая колонка (раздел U)
        const leftX = this.svgSize * 0.2;
        const leftSpacing = this.svgSize * 0.5 / Math.max(leftCount - 1, 1);
        const leftStartY = (this.svgSize - (leftCount - 1) * leftSpacing) / 2;
        
        // Правая колонка (раздел V)
        const rightX = this.svgSize * 0.8;
        const rightSpacing = this.svgSize * 0.5 / Math.max(rightCount - 1, 1);
        const rightStartY = (this.svgSize - (rightCount - 1) * rightSpacing) / 2;
        
        this.nodeCoords = new Array(N);
        let leftPlaced = 0;
        let rightPlaced = 0;
        for (let i = 0; i < N; i++) {
            if (this.partitionByIndex[i] === 0) {
                this.nodeCoords[i] = { x: leftX, y: leftStartY + leftPlaced * leftSpacing };
                leftPlaced++;
            } else {
                this.nodeCoords[i] = { x: rightX, y: rightStartY + rightPlaced * rightSpacing };
                rightPlaced++;
            }
        }
    }

    // Координаты по кругу для обычных графов
    private generateCircularCoordinates() {
        const N = this.nodes.length;
        const R = 100;
        const cx = this.svgSize / 2;
        const cy = this.svgSize / 2;
        
        this.nodeCoords = this.nodes.map((_, i) => {
            const angle = (2 * Math.PI * i) / N - Math.PI / 2;
            return { 
                x: cx + R * Math.cos(angle), 
                y: cy + R * Math.sin(angle) 
            };
        });
    }

    // Хелперы для шаблона
    isNodeLeft(index: number): boolean {
        return this.bipartiteLayout && this.partitionByIndex[index] === 0;
    }
    isNodeRight(index: number): boolean {
        return this.bipartiteLayout && this.partitionByIndex[index] === 1;
    }

    // Сброс результата при изменении inputVector
    ngOnInit() {}
    ngOnChanges() {
        this.showResult = false;
    }

    // SVG: дуга для петли
    getLoopPath(x: number, y: number, idx: number, total: number, loopRadius: number = 28): string {
        const r = loopRadius;
        const angle = (2 * Math.PI * idx) / total - Math.PI / 2;
        const cx = x + r * Math.cos(angle - Math.PI / 6);
        const cy = y + r * Math.sin(angle - Math.PI / 6);
        return `M${x} ${y} Q${cx} ${cy} ${x} ${y}`;
    }

    // SVG: точка на окружности радиуса r от центра (x1, y1) в направлении (x2, y2)
    getEdgePoint(x1: number, y1: number, x2: number, y2: number, r: number = 28) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const ratio = r / len;
        return {
            x: x1 + dx * ratio,
            y: y1 + dy * ratio
        };
    }

    // SVG: выраженная петля сбоку от круга
    getExpressiveLoopPath(x: number, y: number, idx: number, total: number, r: number = 28): string {
        const angle = (2 * Math.PI * idx) / total - Math.PI / 2;
        const startX = x + 18 * Math.cos(angle);
        const startY = y + 18 * Math.sin(angle);
        const perpAngle = angle - Math.PI / 2;
        const c1x = startX + r * Math.cos(perpAngle);
        const c1y = startY + r * Math.sin(perpAngle);
        const c2x = startX + r * Math.cos(perpAngle + Math.PI / 3);
        const c2y = startY + r * Math.sin(perpAngle + Math.PI / 3);
        const endX = x + 18 * Math.cos(angle + 0.5);
        const endY = y + 18 * Math.sin(angle + 0.5);
        return `M${startX} ${startY} C${c1x} ${c1y},${c2x} ${c2y},${endX} ${endY}`;
    }

    // Вычисление овальных контуров разделов на основе координат текущих вершин
    getPartitionOvals() {
        if (!this.bipartiteLayout || this.nodeCoords.length === 0) return null;
        const leftPoints = this.nodeCoords.filter((_, i) => this.partitionByIndex[i] === 0);
        const rightPoints = this.nodeCoords.filter((_, i) => this.partitionByIndex[i] === 1);
        if (leftPoints.length === 0 || rightPoints.length === 0) return null;
        const paddingY = 40;
        const width = 70;
        const leftMinY = Math.min(...leftPoints.map(p => p.y));
        const leftMaxY = Math.max(...leftPoints.map(p => p.y));
        const rightMinY = Math.min(...rightPoints.map(p => p.y));
        const rightMaxY = Math.max(...rightPoints.map(p => p.y));
        const leftX = leftPoints.reduce((s, p) => s + p.x, 0) / leftPoints.length;
        const rightX = rightPoints.reduce((s, p) => s + p.x, 0) / rightPoints.length;
        return {
            left: {
                x: leftX,
                y: (leftMinY + leftMaxY) / 2,
                width,
                height: Math.max(leftMaxY - leftMinY + paddingY, 80)
            },
            right: {
                x: rightX,
                y: (rightMinY + rightMaxY) / 2,
                width,
                height: Math.max(rightMaxY - rightMinY + paddingY, 80)
            }
        };
    }
}
