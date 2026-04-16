export default function formatPhoneNumber(e164: string) {
    // Remove + and ensure it's 11 digits (US number)
    if (e164.startsWith("+1")) {
      const cleaned = e164.replace("+1", "");
  
      const areaCode = cleaned.slice(0, 3);
      const centralOfficeCode = cleaned.slice(3, 6);
      const lineNumber = cleaned.slice(6);
  
      return `(${areaCode}) ${centralOfficeCode}-${lineNumber}`;
    } else {
      return e164;
    }
  }