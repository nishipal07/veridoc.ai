const dns = require('dns').promises;
const net = require('net');

/**
 * Checks whether an IPv4 address is in a private, loopback, or link-local range.
 * @param {string} ip
 * @returns {boolean}
 */
function isPrivateIPv4(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformed IP, block
  }

  const [a, b] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;
  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;
  // 10.0.0.0/8 (Private)
  if (a === 10) return true;
  // 172.16.0.0/12 (Private: 172.16.0.0 - 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16 (Private)
  if (a === 192 && b === 168) return true;
  // 169.254.0.0/16 (Link-local & AWS/Cloud metadata)
  if (a === 169 && b === 254) return true;
  // 100.64.0.0/10 (Carrier-grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true;
  // 255.255.255.255 (Broadcast)
  if (ip === '255.255.255.255') return true;

  return false;
}

/**
 * Checks whether an IPv6 address is private, loopback, or link-local.
 * @param {string} ip
 * @returns {boolean}
 */
function isPrivateIPv6(ip) {
  const normalized = ip.toLowerCase();

  // Loopback ::1
  if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true;
  // Unspecified ::
  if (normalized === '::' || normalized === '0:0:0:0:0:0:0:0') return true;

  // IPv4-mapped IPv6 (::ffff:127.0.0.1)
  if (normalized.startsWith('::ffff:')) {
    const v4Part = normalized.replace('::ffff:', '');
    if (net.isIPv4(v4Part)) {
      return isPrivateIPv4(v4Part);
    }
  }

  // Unique local addresses fc00::/7 (fc00... or fd00...)
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
  // Link-local fe80::/10
  if (normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')) return true;

  return false;
}

/**
 * Validates a URL for SSRF vulnerabilities and protocol correctness.
 * @param {string} inputUrl
 * @returns {Promise<{ isValid: boolean, error?: string, parsedUrl?: URL }>}
 */
async function validateUrl(inputUrl) {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return { isValid: false, error: 'A valid URL string is required.' };
  }

  let parsed;
  try {
    parsed = new URL(inputUrl);
  } catch (err) {
    return { isValid: false, error: 'Malformed URL. Ensure it includes http:// or https://' };
  }

  // Only http and https protocols are allowed
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { isValid: false, error: `Protocol "${parsed.protocol}" is not supported. Use http: or https:` };
  }

  const hostname = parsed.hostname;
  if (!hostname) {
    return { isValid: false, error: 'Invalid hostname in URL.' };
  }

  // Reject obvious localhost variants immediately
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1' ||
    hostname === '[::1]'
  ) {
    return { isValid: false, error: 'Access to localhost and loopback addresses is prohibited.' };
  }

  // Check if hostname is a direct IP
  if (net.isIPv4(hostname)) {
    if (isPrivateIPv4(hostname)) {
      return { isValid: false, error: 'Access to private or local network IP addresses is prohibited.' };
    }
    return { isValid: true, parsedUrl: parsed };
  }

  if (net.isIPv6(hostname)) {
    const rawIp = hostname.replace(/^\[|\]$/g, '');
    if (isPrivateIPv6(rawIp)) {
      return { isValid: false, error: 'Access to private or local IPv6 addresses is prohibited.' };
    }
    return { isValid: true, parsedUrl: parsed };
  }

  // Resolve DNS to verify the target IP is not private/loopback/cloud metadata
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      return { isValid: false, error: `Could not resolve hostname "${hostname}".` };
    }

    for (const record of addresses) {
      const { address, family } = record;
      if (family === 4 && isPrivateIPv4(address)) {
        return { isValid: false, error: `Host "${hostname}" resolves to private/restricted IP (${address}). Scan blocked.` };
      }
      if (family === 6 && isPrivateIPv6(address)) {
        return { isValid: false, error: `Host "${hostname}" resolves to private/restricted IPv6 (${address}). Scan blocked.` };
      }
    }
  } catch (err) {
    if (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN') {
      return { isValid: false, error: `Could not resolve hostname "${hostname}". The website may not exist or is currently unreachable.` };
    }
    return { isValid: false, error: `DNS resolution failed for "${hostname}": ${err.message}` };
  }

  return { isValid: true, parsedUrl: parsed };
}

module.exports = {
  validateUrl,
  isPrivateIPv4,
  isPrivateIPv6
};
