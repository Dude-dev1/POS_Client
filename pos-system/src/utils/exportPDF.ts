import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const exportToPDF = (
  title: string,
  headers: string[][],
  data: any[][],
  filename: string = 'report.pdf'
) => {
  const doc = new jsPDF()

  // Add title
  doc.setFontSize(18)
  doc.text(title, 14, 22)
  doc.setFontSize(11)
  doc.setTextColor(100)

  // Add date
  const dateStr = new Date().toLocaleDateString('en-GB')
  doc.text(`Generated on: ${dateStr}`, 14, 30)

  // Generate table
  autoTable(doc, {
    startY: 35,
    head: headers,
    body: data,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [37, 99, 235] }, // primary blue
  })

  doc.save(filename)
}
