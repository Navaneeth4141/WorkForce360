import ExcelJS from 'exceljs';

/**
 * Generates an Excel spreadsheet buffer from dynamic columns and rows.
 * Highly reusable for payroll, attendance, invoices, expenses, etc.
 * 
 * @param {Object} params
 * @param {string} params.title - Title of the worksheet tab
 * @param {Array} params.headers - Array of column headers: [{ header: 'Employee ID', key: 'employeeId', width: 15 }, ...]
 * @param {Array} params.rows - Array of data rows mapping keys to values
 * @returns {Promise<Buffer>} Buffer containing XLSX file data
 */
export function generateExcelReport({ title, headers, rows }) {
  return new Promise(async (resolve, reject) => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(title || 'Report');

      // 1. Setup columns configuration
      worksheet.columns = headers.map((h) => ({
        header: h.header,
        key: h.key,
        width: h.width || 15,
      }));

      // 2. Add data rows
      worksheet.addRows(rows);

      // 3. Format header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { name: 'Arial', family: 4, size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3A8A' }, // Deep Blue header fill matching style guide
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 25;

      // 4. Align and format cells
      worksheet.eachRow({ includeHeader: false }, (row, rowNumber) => {
        row.height = 20;
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.font = { name: 'Arial', size: 9 };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          };
          
          // If value is numeric, format align right
          if (typeof cell.value === 'number') {
            cell.alignment = { horizontal: 'right' };
          } else {
            cell.alignment = { horizontal: 'left' };
          }
        });
      });

      // 5. Build buffer
      const buffer = await workbook.xlsx.writeBuffer();
      resolve(buffer);
    } catch (error) {
      reject(error);
    }
  });
}
