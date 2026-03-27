import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-test-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './test-map.component.html',
  styleUrls: ['./test-map.component.scss']
})
export class TestMapComponent {
  vectorInput: string = '11100111';
  testMap: string[][] = [];
  testSets: string[] = [];
  faultAxes: string[] = [];

  constructor() {}

  calculateTestMap() {
    this.testMap = [];
    this.testSets = [];
    this.faultAxes = [];

    const vStr = this.vectorInput.trim();
    if (!/^[01]+$/.test(vStr)) {
      alert('Please enter a valid binary string (0s and 1s only).');
      return;
    }

    const v = vStr.split('').map(bit => parseInt(bit, 10));
    const n_len = v.length;
    
    // Check if n_len is a power of 2
    if ((n_len & (n_len - 1)) !== 0 || n_len === 0) {
      alert('The length of the vector must be a power of 2 (e.g., 2, 4, 8, 16).');
      return;
    }

    const n_vars = Math.log2(n_len);

    for (let x = 0; x < n_len; x++) {
      this.faultAxes.push(this.toBinaryString(x, n_vars));
    }

    for (let t = 0; t < n_len; t++) {
      const row: string[] = [];
      const t_bin = this.toBinaryString(t, n_vars);
      this.testSets.push(t_bin);

      for (let x = 0; x < n_len; x++) {
        const d_val = v[t] ^ v[x];
        if (d_val === 0) {
          row.push('.'.repeat(n_vars));
        } else {
          const x_bin = this.toBinaryString(x, n_vars);
          let fault_str = '';
          for (let i = 0; i < n_vars; i++) {
            if (x_bin[i] === '1') {
              // inverse of t_bin[i]
              fault_str += t_bin[i] === '0' ? '1' : '0';
            } else {
              fault_str += '.';
            }
          }
          row.push(fault_str);
        }
      }
      this.testMap.push(row);
    }
  }

  private toBinaryString(num: number, length: number): string {
    return num.toString(2).padStart(length, '0');
  }
}
