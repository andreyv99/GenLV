import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Gate {
  id: number; // Unique ID for the gate
  type: string; // Logical operation type (AND, OR, XOR, NOT, etc.)
  inputs: number[]; // Input signal IDs
  output: number; // Output signal ID
}

@Component({
  selector: 'app-schneider',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './schneider.component.html',
  styleUrls: ['./schneider.component.scss'],
})
export class SchneiderComponent {
  numInputs: number = 2; // Default number of inputs
  resultVectors: string = ''; // Final result vector
  signals: Record<number, number> = {}; // Signal values
  gates: Gate[] = []; // List of gates

  // Set the number of inputs dynamically
  setNumInputs(num: string): void {
    this.numInputs = Number(num);
  }

  // Generate all possible input combinations
  generateInputCombinations(): number[][] {
    const combinations: number[][] = [];
    const totalCombinations = 1 << this.numInputs; // 2^numInputs

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

  // Process all input combinations
  processAllCombinations(): void {
    const combinations = this.generateInputCombinations();
    this.resultVectors = combinations
      .map((inputArray) => this.schneiderMethod(inputArray)[0])
      .join('');
  }

  // Add a new gate
  addGate(): void {
    const usedOutputs = this.gates.map((gate) => gate.output);
    const usedInputs = this.gates.flatMap((gate) => gate.inputs);
    const allUsedSignals = new Set([...usedOutputs, ...usedInputs]);

    let newOutput = 1;
    while (allUsedSignals.has(newOutput)) {
      newOutput++;
    }

    const newGate: Gate = {
      id: this.gates.length + 1,
      type: 'AND', // Default type
      inputs: [],
      output: newOutput,
    };

    this.gates.push(newGate);
  }

  // Remove a gate
  removeGate(id: number): void {
    this.gates = this.gates.filter((gate) => gate.id !== id);
  }

  // Update gate inputs
  updateInputs(gate: Gate, inputs: string): void {
    gate.inputs = inputs
      .split(',')
      .map((input) => Number(input.trim()))
      .filter((input) => !isNaN(input));
  }

  // Update gate output
  updateOutput(gate: Gate, output: string): void {
    gate.output = Number(output);
  }

  // Topological sort to determine the order of gate processing
  topologicalSort(gates: Gate[]): Gate[] {
    const graph: Record<number, number[]> = {};
    const inDegree: Record<number, number> = {};

    // Initialize graph and in-degree counts
    gates.forEach((gate) => {
      graph[gate.id] = [];
      inDegree[gate.id] = 0;
    });

    // Build the dependency graph
    gates.forEach((gate) => {
      gate.inputs.forEach((input) => {
        const sourceGate = gates.find((g) => g.output === input);
        if (sourceGate) {
          graph[sourceGate.id].push(gate.id);
          inDegree[gate.id]++;
        }
      });
    });

    const queue: number[] = [];
    gates.forEach((gate) => {
      if (inDegree[gate.id] === 0) {
        queue.push(gate.id);
      }
    });

    const sortedGates: Gate[] = [];
    while (queue.length > 0) {
      const gateId = queue.shift()!;
      const gate = gates.find((g) => g.id === gateId)!;
      sortedGates.push(gate);

      graph[gateId].forEach((neighborId) => {
        inDegree[neighborId]--;
        if (inDegree[neighborId] === 0) {
          queue.push(neighborId);
        }
      });
    }

    // Check for cycles
    if (sortedGates.length !== gates.length) {
      throw new Error('Circuit contains a cycle!');
    }

    return sortedGates;
  }

  // Process the circuit for a given input array
  schneiderMethod(inputArray: number[]): number[] {
    this.signals = {}; // Reset signals

    // Initialize input signals
    for (let i = 0; i < inputArray.length; i++) {
      this.signals[i + 1] = inputArray[i];
      console.log(`Input ${i + 1}: ${this.signals[i + 1]}`); // Log input signals
    }

    // Topological sort
    let sortedGates: Gate[];
    try {
      sortedGates = this.topologicalSort(this.gates);
    } catch (error: any) {
      console.error(error.message);
      return [];
    }

    // Compute gate outputs in sorted order
    for (const gate of sortedGates) {
      const inputValues = gate.inputs.map((id) => this.signals[id] ?? 0);
      const output = this.evaluateGate(gate.type, inputValues);
      this.signals[gate.output] = output;
      console.log(`Gate ${gate.id} (${gate.type}) - Inputs: ${inputValues}, Output: ${output}`); // Log gate outputs
    }

    // Return the output of the last gate
    const lastGate = this.gates[this.gates.length - 1];
    const finalOutput = lastGate ? [this.signals[lastGate.output] || 0] : [];
    console.log(`Final Output: ${finalOutput}`); // Log final output
    return finalOutput;
  }

  // Evaluate a logical operation
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
          return 1; // No inputs, consider it true
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
