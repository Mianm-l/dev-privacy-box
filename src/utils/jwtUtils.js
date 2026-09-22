/**
 * JWT Offline Inspector Utility (100% Client-Side)
 */

function base64UrlDecode(str) {
  let output = str.replace(/-/g, '+').replace(/_/g, '/');
  switch (output.length % 4) {
    case 0: break;
    case 2: output += '=='; break;
    case 3: output += '='; break;
    default: throw new Error('非法 Base64URL 字符串');
  }
  const decoded = atob(output);
  try {
    return decodeURIComponent(
      decoded.split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
  } catch {
    return decoded;
  }
}

export function parseJwt(jwtString) {
  if (!jwtString || !jwtString.trim()) {
    return null;
  }

  const cleanJwt = jwtString.trim().replace(/^Bearer\s+/i, '');
  const parts = cleanJwt.split('.');

  if (parts.length !== 3) {
    throw new Error('无效的 JWT 格式（JWT 应由 3 个点号分隔的部分组成）');
  }

  const [headerB64, payloadB64, signature] = parts;

  let header = {};
  let payload = {};

  try {
    header = JSON.parse(base64UrlDecode(headerB64));
  } catch (e) {
    throw new Error('解析 JWT Header 失败：' + e.message);
  }

  try {
    payload = JSON.parse(base64UrlDecode(payloadB64));
  } catch (e) {
    throw new Error('解析 JWT Payload 失败：' + e.message);
  }

  // Parse time stamps
  let expDate = null;
  let iatDate = null;
  let isExpired = false;
  let remainingText = '';

  if (payload.exp) {
    expDate = new Date(payload.exp * 1000);
    const now = new Date();
    isExpired = expDate.getTime() <= now.getTime();

    const diffMs = Math.abs(expDate.getTime() - now.getTime());
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (isExpired) {
      remainingText = `已过期 ${diffDay > 0 ? diffDay + '天 ' : ''}${diffHour % 24}小时 ${diffMin % 60}分钟`;
    } else {
      remainingText = `剩余有效期：${diffDay > 0 ? diffDay + '天 ' : ''}${diffHour % 24}小时 ${diffMin % 60}分钟`;
    }
  }

  if (payload.iat) {
    iatDate = new Date(payload.iat * 1000);
  }

  return {
    header,
    payload,
    signature,
    expDate: expDate ? expDate.toLocaleString('zh-CN', { hour12: false }) : null,
    iatDate: iatDate ? iatDate.toLocaleString('zh-CN', { hour12: false }) : null,
    isExpired,
    remainingText
  };
}
