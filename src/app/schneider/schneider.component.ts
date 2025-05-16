import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Gate {
  id: number;
  type: string;
  inputs: number[]; // Array of input signal IDs
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

  constructor() {
    this.addInitialGates();
  }

  addInitialGates() {
    // Add initial gates based on the image, using XNOR where appropriate
    this.addGate('XNOR', [1, 3], 5); // Gate 5
    this.addGate('XNOR', [2, 3], 6); // Gate 6
    this.addGate('XNOR', [2, 4], 7); // Gate 7
    this.addGate('XNOR', [5, 3], 8); // Gate 8
    this.addGate('XNOR', [2, 5], 9); // Gate 9
    this.addGate('XNOR', [1, 6], 10); // Gate 10
    this.addGate('XNOR', [4, 6], 11); // Gate 11
    this.addGate('XNOR', [8, 9, 10, 11], 12); // Gate Q
  }

  addGate(type: string, inputs: number[], output: number): void {
    const newGate: Gate = {
      id: this.nextGateId++,
      type: type,
      inputs: inputs,
      output: output,
    };
    this.gates.push(newGate);
    this.nextSignalId = Math.max(this.nextSignalId, output + 1);
  }

  addNewGate(): void {
    const inputs = this.newGateInputs.split(',').map(Number).filter(Number);
    this.addGate(this.newGateType, inputs, this.newGateOutput);
    this.newGateOutput = this.nextSignalId;
    this.newGateInputs = '';
  }

  updateInputs(gate: Gate, inputs: string): void {
    gate.inputs = inputs.split(',').map(Number).filter(Number);
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
      const inputValues = gate.inputs.map((inputId) => this.signals[inputId] ?? 0);
      this.signals[gate.output] = this.evaluateGate(gate.type, inputValues);
    }

    // The final output is assumed to be the signal with the highest ID
    const outputGate = this.gates.find(gate => gate.output === 12);
    return this.signals[outputGate!.output] || 0;
  }

  evaluateGate(type: string, inputs: number[]): number {
    switch (type) {
      case 'AND':
        return inputs.reduce((a, b) => a & b, 1);
      case 'OR':
        return inputs.reduce((a, b) => a | b, 0);
      case 'XOR':
        return inputs.reduce((a, b) => a ^ b, 0);
      case 'NOT':
        return inputs.length === 1 ? 1 - inputs[0] : 0;
      case 'NOR':
        return inputs.reduce((a, b) => a | b, 0) === 0 ? 1 : 0;
      case 'XNOR':
        if (inputs.length === 0) {
          return 1;
        }
        let parity = 0;
        for (const input of inputs) {
          parity ^= input;
        }
        return parity === 0 ? 1 : 0;
      default:
        throw new Error(`Unknown gate type: ${type}`);
    }
  }
}
