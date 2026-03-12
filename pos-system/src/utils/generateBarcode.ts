import JsBarcode from 'jsbarcode'

export const generateBarcode = (value: string, elementId: string) => {
  const element = document.getElementById(elementId)
  if (element) {
    JsBarcode(element, value, {
      format: 'EAN13',
      width: 2,
      height: 40,
      displayValue: true,
    })
  }
}
