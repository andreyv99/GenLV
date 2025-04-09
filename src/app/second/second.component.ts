import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-second',
    standalone: true,
    imports: [FormsModule, CommonModule],
    templateUrl: './second.component.html',
    styleUrls: ['./second.component.scss'],
})
export class SecondComponent {
    inputVectors: string[] = ['', ''];
    signatureVector: string = '';
    mergedInputs: string = ''; // Indices of merged inputs (e.g., "2,3")
    resultMatrix: any[][] = [];
    resultString: string = '';
    colHeaders: string[] = [];
    rowHeaders: string[] = [];
    combinationSignature = [0, 0, 0, 1]

    generateResult(): void {
        // this.colHeaders = this.generateBitwiseValues(this.inputVector1.length);
        // this.rowHeaders = this.generateBitwiseValues(this.inputVector2.length);
        console.log(this.inputVectors);

        this.inputVectors.forEach(vector => {
            if (!this.isValidInput(vector)) {
                alert('Enter only 0 or 1');
                return;
            }
        })

        // const mergedIndexes = this.mergedInputs
        //     .split(',')
        //     .map((i) => parseInt(i.trim(), 10))
        //     .filter((i) => !isNaN(i))

        // const rows = this.inputVector1.split('').map(Number);
        // const cols = this.inputVector2.split('').map(Number);
        const signatureArr = this.signatureVector.split('').map(Number);
        console.log(this.inputVectors);

        // const combinedVector = this.inputVectors.reduce((acc, vector, index) => {
        //     console.log(acc, vector, index);

        //     return acc;
        // })

        // this.resultMatrix = rows.map((row, i) =>
        //     cols.map((col, j) => {
        //         const combinedBinaryValue = this.rowHeaders[i] + this.colHeaders[j];
        //         const noNeedValue = new Set(mergedIndexes.map(i => combinedBinaryValue[i - 1])).size > 1;
        //         if (noNeedValue) {
        //             return '-';
        //         }
        //         const index = (row << 1) | col;
        //         return signatureArr[index] !== undefined ? signatureArr[index] : 0;
        //     })
        // );

        this.resultString = this.resultMatrix.flat().filter(i => i !== '-').join('');
    }

    isValidInput(vector: string): boolean {
        return /^[01]+$/.test(vector);
    }

    addVector(): void {
        this.inputVectors.push('');
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
