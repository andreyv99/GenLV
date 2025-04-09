import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-second',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './second.component.html',
  styleUrls: ['./second.component.scss'],
})
export class SecondComponent implements OnInit {
  resultMatrix: any[][] = [];
  resultString: string = '';
  colHeaders: string[] = [];
  rowHeaders: string[] = [];
  combinationSignature = [0, 0, 0, 1]
  form: any;
  rowsVector: number[] = [];
  colsVector: number[] = [];

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      inputVectors: this.fb.array(['', '']),
      signatureVector: this.fb.control('', Validators.required),
      mergedInputs: this.fb.control(''),
      operation: this.fb.control('and'),
    });
  }

  get inputVectors() {
    return this.form.controls["inputVectors"] as FormArray;
  }

  get signatureVector() {
    return this.form.controls["signatureVector"].value;
  }


  generateResult(): void {
    const inputVectors: string[] = this.form.get('inputVectors').value;
    let combinedVector;
    inputVectors.forEach((vector: string) => {
      if (!this.isValidInput(vector)) {
        alert('Enter only 0 or 1');
        return;
      }
    })

    // const mergedIndexes = this.mergedInputs
    //     .split(',')
    //     .map((i) => parseInt(i.trim(), 10))
    //     .filter((i) => !isNaN(i))

    const signatureArr = this.form.get('signatureVector').value.split('').map(Number);
    if (inputVectors.length > 2) {
      combinedVector = inputVectors.reduce((acc, vector, index) => {
        console.log(acc, vector, index);
        if (index < inputVectors.length - 1) {
          const aInt = parseInt(acc, 2);
          const bInt = parseInt(vector, 2);
          if (this.form.get('operation').value === 'and') {
            return (aInt & bInt).toString(2).padStart(acc.length, '0');
          } else {
            return (aInt | bInt).toString(2).padStart(acc.length, '0');
          }
        }
        return acc;
      })
    }

    this.rowsVector = combinedVector?.split('').map(Number) || inputVectors[0].split('').map(Number);
    this.colsVector = inputVectors[inputVectors.length - 1].split('').map(Number);

    this.colHeaders = this.generateBitwiseValues(this.rowsVector.length);
    this.rowHeaders = this.generateBitwiseValues(this.colsVector.length);

    this.resultMatrix = this.rowsVector.map((row, i) =>
      this.colsVector.map((col, j) => {
        // const combinedBinaryValue = this.rowHeaders[i] + this.colHeaders[j];
        // const noNeedValue = new Set(mergedIndexes.map(i => combinedBinaryValue[i - 1])).size > 1;
        // if (noNeedValue) {
        //     return '-';
        // }
        const index = (row << 1) | col;
        return signatureArr[index] !== undefined ? signatureArr[index] : 0;
      })
    );

    this.resultString = this.resultMatrix.flat().filter(i => i !== '-').join('');
  }

  isValidInput(vector: string): boolean {
    return /^[01]+$/.test(vector);
  }

  addVector(): void {
    this.inputVectors.push(this.fb.control(''))
  }

  generateBitwiseValues(n: number) {
    if (n <= 0) return [];

    const bitLength = Math.ceil(Math.log2(n));
    const result: string[] = [];

    for (let i = 0; i < n; i++) {
      const binary = i.toString(2).padStart(bitLength, '0');
      result.push(binary);
    }

    return result;
  }
}
