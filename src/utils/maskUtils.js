/**
 * Sensitive Data Masking Utility (100% Client-Side)
 */

export const MASK_RULES = {
  PHONE: {
    id: 'phone',
    name: '手机号码 (Phone)',
    pattern: /(?<!\d)(1[3-9]\d)(\d{4})(\d{4})(?!\d)/g,
    replace: '$1****$3'
  },
  ID_CARD: {
    id: 'idCard',
    name: '身份证号 (18位 ID Card)',
    pattern: /(?<!\d)([1-9]\d{5})(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}([0-9Xx])(?!\d)/g,
    replace: '$1********$2'
  },
  EMAIL: {
    id: 'email',
    name: '电子邮箱 (Email)',
    pattern: /([a-zA-Z0-9_.+-])[a-zA-Z0-9_.+-]*([a-zA-Z0-9_.+-])@([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/g,
    replace: '$1****$2@$3'
  },
  BANK_CARD: {
    id: 'bankCard',
    name: '银行卡号 (16-19位 Card)',
    pattern: /(?<!\d)([1-9]\d{5})(\d{6,9})(\d{4})(?!\d)/g,
    replace: '$1******$3'
  },
  IP_ADDRESS: {
    id: 'ip',
    name: 'IPv4 地址',
    pattern: /(?<!\d)((?:\d{1,3}\.){2})\d{1,3}\.\d{1,3}(?!\d)/g,
    replace: '$1*.*'
  }
};

/**
 * Apply masking to input text based on enabled rule flags
 */
export function maskText(text, options = {}) {
  if (!text) return '';

  let result = text;
  const {
    maskPhone = true,
    maskIdCard = true,
    maskEmail = true,
    maskBankCard = true,
    maskIp = false
  } = options;

  if (maskPhone) {
    result = result.replace(MASK_RULES.PHONE.pattern, MASK_RULES.PHONE.replace);
  }
  if (maskIdCard) {
    result = result.replace(MASK_RULES.ID_CARD.pattern, MASK_RULES.ID_CARD.replace);
  }
  if (maskEmail) {
    result = result.replace(MASK_RULES.EMAIL.pattern, MASK_RULES.EMAIL.replace);
  }
  if (maskBankCard) {
    result = result.replace(MASK_RULES.BANK_CARD.pattern, MASK_RULES.BANK_CARD.replace);
  }
  if (maskIp) {
    result = result.replace(MASK_RULES.IP_ADDRESS.pattern, MASK_RULES.IP_ADDRESS.replace);
  }

  return result;
}
