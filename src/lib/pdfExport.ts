import jsPDF from 'jspdf'
import { Property, Expense, MaintenanceTask } from './types'

interface TaxSummaryData {
  totalIncome: number
  totalExpenses: number
  netTaxableIncome: number
  dateRange: { start: string; end: string } | null
}

interface ProfitLossData {
  property: string
  monthlyRent: number
  totalExpenses: number
  netIncome: number
  roi: number
}

export const generateTaxReportPDF = (
  taxSummary: TaxSummaryData,
  profitLossData: ProfitLossData[],
  properties: Property[],
  expenses: Expense[],
  maintenanceTasks: MaintenanceTask[]
) => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let yPosition = 20

  // Helper function to add text
  const addText = (text: string, x: number, y: number, options: any = {}) => {
    doc.setFontSize(options.fontSize || 12)
    doc.setTextColor(options.color || '#000000')
    doc.text(text, x, y)
  }

  // Helper function to add line
  const addLine = (x1: number, y1: number, x2: number, y2: number) => {
    doc.setDrawColor(200, 200, 200)
    doc.line(x1, y1, x2, y2)
  }

  // Header
  addText('LandlordHub - Tax Report', margin, yPosition, { fontSize: 20, color: '#3b82f6' })
  yPosition += 10
  addText(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition, { fontSize: 10, color: '#666666' })
  yPosition += 15

  // Date Range
  if (taxSummary.dateRange) {
    addText(`Report Period: ${taxSummary.dateRange.start} to ${taxSummary.dateRange.end}`, margin, yPosition)
    yPosition += 10
  }

  // Tax Summary Section
  addText('TAX SUMMARY', margin, yPosition, { fontSize: 16, color: '#1f2937' })
  yPosition += 10
  addLine(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 10

  // Tax Summary Data
  addText(`Total Income: $${taxSummary.totalIncome.toLocaleString()}`, margin, yPosition)
  yPosition += 8
  addText(`Total Deductible Expenses: $${taxSummary.totalExpenses.toLocaleString()}`, margin, yPosition)
  yPosition += 8
  addText(`Net Taxable Income: $${taxSummary.netTaxableIncome.toLocaleString()}`, margin, yPosition, {
    color: taxSummary.netTaxableIncome >= 0 ? '#10b981' : '#ef4444'
  })
  yPosition += 20

  // Property Summary Section
  addText('PROPERTY SUMMARY', margin, yPosition, { fontSize: 16, color: '#1f2937' })
  yPosition += 10
  addLine(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 10

  // Property Summary Table
  const tableHeaders = ['Property', 'Monthly Rent', 'Expenses', 'Net Income', 'ROI%']
  const colWidths = [60, 30, 30, 30, 20]
  let currentX = margin

  // Headers
  tableHeaders.forEach((header, index) => {
    addText(header, currentX, yPosition, { fontSize: 10, color: '#374151' })
    currentX += colWidths[index]
  })
  yPosition += 8
  addLine(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 5

  // Data rows
  profitLossData.forEach((row) => {
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }
    
    currentX = margin
    const rowData = [
      row.property.length > 25 ? row.property.substring(0, 25) + '...' : row.property,
      `$${row.monthlyRent.toLocaleString()}`,
      `$${row.totalExpenses.toLocaleString()}`,
      `$${row.netIncome.toLocaleString()}`,
      `${row.roi.toFixed(1)}%`
    ]
    
    rowData.forEach((data, index) => {
      addText(data, currentX, yPosition, { fontSize: 9 })
      currentX += colWidths[index]
    })
    yPosition += 6
  })

  // Totals row
  yPosition += 5
  addLine(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 5
  
  const totals = profitLossData.reduce((acc, row) => ({
    monthlyRent: acc.monthlyRent + row.monthlyRent,
    totalExpenses: acc.totalExpenses + row.totalExpenses,
    netIncome: acc.netIncome + row.netIncome
  }), { monthlyRent: 0, totalExpenses: 0, netIncome: 0 })

  currentX = margin
  const totalData = [
    'TOTAL',
    `$${totals.monthlyRent.toLocaleString()}`,
    `$${totals.totalExpenses.toLocaleString()}`,
    `$${totals.netIncome.toLocaleString()}`,
    '-'
  ]
  
  totalData.forEach((data, index) => {
    addText(data, currentX, yPosition, { fontSize: 9, color: '#1f2937' })
    currentX += colWidths[index]
  })

  yPosition += 20

  // Expense Categories Section
  if (yPosition > 200) {
    doc.addPage()
    yPosition = 20
  }

  addText('EXPENSE CATEGORIES', margin, yPosition, { fontSize: 16, color: '#1f2937' })
  yPosition += 10
  addLine(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 10

  // Calculate category totals
  const categoryMap = new Map<string, number>()
  expenses.forEach(expense => {
    const current = categoryMap.get(expense.category) || 0
    categoryMap.set(expense.category, current + expense.amount)
  })

  const totalExpenses = Array.from(categoryMap.values()).reduce((sum, amount) => sum + amount, 0)
  
  Array.from(categoryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, amount]) => {
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }
      
      const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
      addText(`${category}: $${amount.toLocaleString()} (${percentage.toFixed(1)}%)`, margin, yPosition)
      yPosition += 6
    })

  yPosition += 10

  // Footer
  if (yPosition > 250) {
    doc.addPage()
    yPosition = 20
  }

  addText('This report was generated by LandlordHub Property Management Suite', margin, yPosition, { fontSize: 10, color: '#666666' })
  yPosition += 5
  addText('For questions about this report, please contact your tax professional.', margin, yPosition, { fontSize: 10, color: '#666666' })

  // Save the PDF
  const fileName = `tax-report-${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}
