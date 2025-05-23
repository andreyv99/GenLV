import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Gate {
  id: number;
  signature: string; // Бинарная сигнатура, определяющая функцию гейта
  inputs: any; // Array of input signal IDs
  output: number; // Output signal ID
}

interface Connection {
  fromGate: number; // ID of the gate where the connection originates
  toGate: number; // ID of the gate where the connection terminates
  toInputIndex: number; // Index of the input on the destination gate (0-based)
}

@Component({
  selector: 'app-schneider',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './schneider.component.html',
  styleUrls: ['./schneider.component.scss'],
})
export class SchneiderComponent {
  numInputs: number = 4; // Default number of inputs
  gates: Gate[] = [];
  connections: Connection[] = [];
  resultVectors: string = '';
  signals: Record<number, number> = {};
  nextGateId: number = 1;
  nextSignalId: number = 5;

  newGateType: string = 'AND';
  newGateInputs: string = '';
  newGateOutput: number = this.nextSignalId;
  newGateSignature: string = '';

  inputVectors: string[] = ['', '']; // Входные векторы, задаются пользователем

  layoutGates: { gate: any, x: number, y: number, level: number }[] = [];
  layoutInputs: { index: number, x: number, y: number }[] = [];

  constructor() {
    this.addInitialGates();
  }

  addInitialGates() {
    // Add initial gates using NOR signatures
    this.addGate('1000', '1, 3', 5); // Gate 5 (2 inputs)
    this.addGate('1000', '2, 3', 6); // Gate 6 (2 inputs)
    this.addGate('1000', '2, 4', 7); // Gate 7 (2 inputs)
    this.addGate('1000', '2, 5', 8); // Gate 8 (2 inputs)
    this.addGate('1000', '1, 6', 9); // Gate 9 (2 inputs)
    this.addGate('1000', '4, 6', 10); // Gate 10 (2 inputs)
    this.addGate('1000', '3, 7', 11); // Gate 11 (2 inputs)
    this.addGate('1000000000000000', '8, 9, 10, 11', 12); // Gate Q (4 inputs)
  }

  get Math() {
    return Math;
  }
  addGate(signature: string, inputs: string, output: number): void {
    const newGate: Gate = {
      id: this.nextGateId++,
      signature: signature,
      inputs: inputs,
      output: output,
    };
    this.gates.push(newGate);
    this.nextSignalId = Math.max(this.nextSignalId, output + 1);
  }

  addNewGate(): void {
    const inputs = this.newGateInputs;
    this.addGate(this.newGateSignature, inputs, this.newGateOutput);
    this.newGateOutput = this.nextSignalId;
    this.newGateInputs = '';
    this.newGateSignature = '';
  }

  updateInputs(gate: Gate, inputs: string): void {
    // gate.inputs = inputs.split(',').map(Number).filter(Number);
  }

  removeGate(id: number): void {
    this.gates = this.gates.filter((gate) => gate.id !== id);
    this.connections = this.connections.filter(
      (connection) => connection.fromGate !== id && connection.toGate !== id
    );
  }

  addConnection(fromGate: number, toGate: number, toInputIndex: number): void {
    const newConnection: Connection = {
      fromGate: fromGate,
      toGate: toGate,
      toInputIndex: toInputIndex,
    };
    this.connections.push(newConnection);
  }

  removeConnection(fromGate: number, toGate: number, toInputIndex: number): void {
    this.connections = this.connections.filter(
      (connection) =>
        connection.fromGate !== fromGate ||
        connection.toGate !== toGate ||
        connection.toInputIndex !== toInputIndex
    );
  }

  generateInputCombinations(): number[][] {
    const combinations: number[][] = [];
    const totalCombinations = 1 << this.numInputs;

    for (let i = 0; i < totalCombinations; i++) {
      const combination = i
        .toString(2)
        .padStart(this.numInputs, '0')
        .split('')
        .map(Number);
      combinations.push(combination);
    }

    return combinations;
  }

  processAllCombinations(): void {
    const combinations = this.generateInputCombinations();
    this.resultVectors = combinations
      .map((inputArray) => this.processCircuit(inputArray))
      .join('');
  }

  processCircuit(inputArray: number[]): number {
    this.signals = {};

    // Initialize input signals
    for (let i = 0; i < inputArray.length; i++) {
      this.signals[i + 1] = inputArray[i];
    }

    // Evaluate gates
    for (const gate of this.gates) {
      const inputValues = gate.inputs.replace(/\s+/g, '').split(',').map(Number).filter(Number).map((inputId: number) => this.signals[inputId] ?? 0);
      this.signals[gate.output] = this.evaluateGateBySignature(gate.signature, inputValues);
    }

    // Dynamically determine the output gate
    let outputGate: Gate | undefined;
    if (this.gates.length > 0) {
      outputGate = this.gates.reduce((prev, current) =>
        (prev.output > current.output) ? prev : current);
    }

    return outputGate ? this.signals[outputGate.output] || 0 : 0;
  }

  evaluateGateBySignature(signature: string, inputs: number[]): number {
    if (!signature || inputs.length === 0) return 0;
    const index = parseInt(inputs.join(''), 2);
    const sigArr = signature.split('').map(Number);
    return sigArr[index] !== undefined ? sigArr[index] : 0;
  }

  isValidBinaryVector(vector: string): boolean {
    return /^[01]+$/.test(vector);
  }

  processCartesianScheme(): void {
    // Проверка валидности всех входных векторов
    if (this.inputVectors.some(v => !this.isValidBinaryVector(v))) {
      alert('Все входные векторы должны содержать только 0 или 1');
      return;
    }
    const vectors = this.inputVectors.map(v => v.split('').map(Number));
    if (vectors.some(arr => arr.length === 0)) {
      alert('Все векторы должны быть непустыми');
      return;
    }
    // Генерируем все комбинации входных битов (декартово произведение)
    const cartesian = (arrs: number[][]): number[][] => {
      return arrs.reduce((acc, curr) => acc.flatMap(a => curr.map(b => a.concat([b]))), [[]] as number[][]);
    };
    const allCombinations = cartesian(vectors);
    // Для каждой комбинации вычисляем результат схемы
    const results = allCombinations.map(bits => {
      // Заполняем сигналы входов
      this.signals = {};
      for (let i = 0; i < bits.length; i++) {
        this.signals[i + 1] = bits[i];
      }
      // Вычисляем значения всех гейтов
      for (const gate of this.gates) {
        const inputValues = gate.inputs.replace(/\s+/g, '').split(',').map(Number).filter(Number).map((inputId: number) => this.signals[inputId] ?? 0);
        this.signals[gate.output] = this.evaluateGateBySignature(gate.signature, inputValues);
      }
      // Выход схемы — выход последнего гейта
      let outputGate: Gate | undefined;
      if (this.gates.length > 0) {
        outputGate = this.gates.reduce((prev, current) =>
          (prev.output > current.output) ? prev : current);
      }
      return outputGate ? this.signals[outputGate.output] || 0 : 0;
    });
    this.resultVectors = results.join('');
  }

  ngDoCheck() {
    this.updateLayout();
  }

  updateLayout() {
    // 1. Вычисляем уровень (depth) для каждого гейта
    const gateLevels: Map<number, number> = new Map();
    const getLevel = (gate: Gate): number => {
      if (gateLevels.has(gate.id)) return gateLevels.get(gate.id)!;
      let maxInputLevel = 0;
      for (const inp of gate.inputs.replace(/\s+/g, '').split(',').map(Number).filter(Number)) {
        if (inp <= this.numInputs) continue;
        const prevGate = this.gates.find(g => g.output === inp);
        if (prevGate) {
          maxInputLevel = Math.max(maxInputLevel, getLevel(prevGate) + 1);
        }
      }
      gateLevels.set(gate.id, maxInputLevel);
      return maxInputLevel;
    };
    // 2. Группируем гейты по уровням
    const gatesByLevel: Gate[][] = [];
    for (const gate of this.gates) {
      const level = getLevel(gate);
      if (!gatesByLevel[level]) gatesByLevel[level] = [];
      gatesByLevel[level].push(gate);
    }
    // 3. Вычисляем координаты для входов
    this.layoutInputs = Array.from({ length: this.numInputs }, (_, i) => ({
      index: i + 1,
      x: 60,
      y: 80 + i * 80,
    }));
    // 4. Вычисляем координаты для гейтов
    this.layoutGates = [];
    const xStep = 160;
    const yStep = 100;
    gatesByLevel.forEach((gates, level) => {
      gates.forEach((gate, i) => {
        const newGate: Gate = { ...gate }
        newGate.inputs = newGate.inputs.replace(/\s+/g, '').split(',').map(Number).filter(Number);
        this.layoutGates.push({
          gate: newGate,
          x: 200 + level * xStep,
          y: 80 + i * yStep,
          level,
        });
      });
    });
  }
}
