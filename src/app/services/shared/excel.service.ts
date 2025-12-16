import * as XLSX from 'xlsx';
import { Injectable } from '@angular/core';

@Injectable({
	providedIn: 'root',
})
export class ExcelService {
	exportToExcel(data: any[], filename: string, sheetName: string) {
		const worksheet = XLSX.utils.json_to_sheet(data);

		const cols = Object.keys(data[0]).map((key) => ({
			wch: Math.max(key.length, ...data.map((row) => String(row[key]).length)),
		}));

		worksheet['!cols'] = cols;

		const workbook = {
			Sheets: { [sheetName]: worksheet },
			SheetNames: [sheetName],
		};

		XLSX.writeFile(workbook, `${filename}.xlsx`);
	}
}
