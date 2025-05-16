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
    this.addGate('NOR', [1, 3], 5); // Gate 5
    this.addGate('NOR', [2, 3], 6); // Gate 6
    this.addGate('NOR', [2, 4], 7); // Gate 7
    this.addGate('NOR', [5, 3], 8); // Gate 8
    this.addGate('NOR', [2, 5], 9); // Gate 9
    this.addGate('NOR', [1, 6], 10); // Gate 10
    this.addGate('NOR', [4, 6], 11); // Gate 11
    this.addGate('NOR', [8, 9, 10, 11], 12); // Gate Q
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

    // Dynamically determine the output gate
    let outputGate: Gate | undefined;
    if (this.gates.length > 0) {
      outputGate = this.gates.reduce((prev, current) =>
        (prev.output > current.output) ? prev : current);
    }

    return outputGate ? this.signals[outputGate.output] || 0 : 0;
  }

  evaluateGate(type: string, inputs: number[]): number {
    let result: number;
    switch (type) {
      case 'AND':
        result = inputs.reduce((a, b) => a & b, 1);
        break;
      case 'OR':
        result = inputs.reduce((a, b) => a | b, 0);
        break;
      case 'XOR':
        result = inputs.reduce((a, b) => a ^ b, 0);
        break;
      case 'NOT':
        result = inputs.length === 1 ? 1 - inputs[0] : 0;
        break;
      case 'NOR':
        const orResult = inputs.reduce((a, b) => a | b, 0);
        result = orResult === 0 ? 1 : 0;
        break;
      case 'XNOR':
        if (inputs.length === 0) {
          result = 1;
        } else {
          let parity = inputs[0];
          for (let i = 1; i < inputs.length; i++) {
            parity = !(parity ^ inputs[i]) ? 1 : 0;
          }
          result = parity;
        }
        break;
      default:
        throw new Error(`Unknown gate type: ${type}`);
    }
    console.log(`Gate ${type} - Inputs: ${inputs}, Output: ${result}`);
    return result;
  }
}
