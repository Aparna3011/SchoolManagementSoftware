function twoDigitWords(n) {
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (n < 20) return ones[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return `${tens[t]}${o ? ` ${ones[o]}` : ''}`.trim();
}

function threeDigitWords(n) {
  const hundred = Math.floor(n / 100);
  const rest = n % 100;

  if (!hundred) return twoDigitWords(rest);
  if (!rest) return `${twoDigitWords(hundred)} Hundred`;
  return `${twoDigitWords(hundred)} Hundred ${twoDigitWords(rest)}`;
}

function integerToIndianWords(num) {
  if (num === 0) return 'Zero';

  const crore = Math.floor(num / 10000000);
  num %= 10000000;

  const lakh = Math.floor(num / 100000);
  num %= 100000;

  const thousand = Math.floor(num / 1000);
  num %= 1000;

  const hundredPart = num; // 0..999

  const parts = [];
  if (crore) parts.push(`${twoDigitWords(crore)} Crore`);
  if (lakh) parts.push(`${twoDigitWords(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigitWords(thousand)} Thousand`);
  if (hundredPart) parts.push(threeDigitWords(hundredPart));

  return parts.join(' ').trim();
}

function amountToWordsINR(amount) {
  const normalized = Number(amount || 0);
  if (!Number.isFinite(normalized) || normalized < 0) return '';

  const rupees = Math.floor(normalized);
  const paise = Math.round((normalized - rupees) * 100);

  const rupeesWords = integerToIndianWords(rupees);
  if (paise > 0) {
    const paiseWords = integerToIndianWords(paise);
    return `${rupeesWords} Rupees And ${paiseWords} Paise Only`;
  }

  return `${rupeesWords} Rupees Only`;
}

module.exports = { amountToWordsINR };