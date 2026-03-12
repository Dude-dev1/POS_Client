import ExcelJS from 'exceljs'

export const exportToExcel = async (
  title: string,
  columns: { header: string; key: string; width: number }[],
  data: any[],
  filename: string = 'report.xlsx'
) => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet(title)

  // Add columns
  worksheet.columns = columns

  // Add data
  worksheet.addRows(data)

  // Style header
  worksheet.getRow(1).font = { bold: true }
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' }, // primary blue
  }
  worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true }

  // Generate buffer and save
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.URL.revokeObjectURL(url)
}
