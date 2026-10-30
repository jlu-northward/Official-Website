import { readSheet } from "read-excel-file/browser";
import { gpaImportContent as copy } from "./content/gpa-import.ts";
import { GradeImportError, parseGradeRows } from "./gpa-import.ts";

export async function readGradeExcel(file: File) {
	let rows;
	try {
		rows = await readSheet(file);
	} catch {
		throw new GradeImportError(copy.readError);
	}
	return parseGradeRows(rows);
}
