import * as XLSX from 'xlsx';
import { Injectable } from '@angular/core';

@Injectable({
	providedIn: 'root',
})
export class ExcelService {
	exportTable(el: HTMLElement, fileName: string, sheetName: string) {
		const worksheet = XLSX.utils.table_to_sheet(el);
		const workbook = XLSX.utils.book_new();

		XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
		XLSX.writeFile(workbook, `${fileName}.xlsx`);
	}
}
