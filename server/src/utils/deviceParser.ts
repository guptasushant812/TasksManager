import { Request } from 'express';
import { isIP } from 'net';

export interface ParsedClientInfo {
  browser: string;
  os: string;
  device: string;
  ipAddress: string;
}

export function extractClientIp(req: Request): string {
  // Uses Express req.ip which honors app.set('trust proxy') settings
  let rawIp = req.ip || req.socket?.remoteAddress || '127.0.0.1';

  if (rawIp.startsWith('::ffff:')) {
    rawIp = rawIp.slice(7);
  }

  if (isIP(rawIp) !== 0) {
    return rawIp;
  }

  const socketIp = req.socket?.remoteAddress;
  if (socketIp) {
    const cleanSocketIp = socketIp.startsWith('::ffff:') ? socketIp.slice(7) : socketIp;
    if (isIP(cleanSocketIp) !== 0) {
      return cleanSocketIp;
    }
  }

  return '127.0.0.1';
}

export function parseClientInfo(
  userAgentOrReq: string | undefined | Request,
  fallbackIp?: string | string[]
): ParsedClientInfo {
  let userAgent = '';
  let ipAddress = '127.0.0.1';

  if (userAgentOrReq && typeof userAgentOrReq === 'object' && 'headers' in userAgentOrReq) {
    const req = userAgentOrReq as Request;
    userAgent = req.headers['user-agent'] || '';
    ipAddress = extractClientIp(req);
  } else {
    userAgent = (userAgentOrReq as string) || '';
    if (typeof fallbackIp === 'string' && isIP(fallbackIp.trim()) !== 0) {
      ipAddress = fallbackIp.trim();
    }
  }

  const ua = userAgent.toLowerCase();

  // Determine Operating System
  let os = 'Unknown OS';
  if (ua.includes('win')) os = 'Windows';
  else if (ua.includes('mac') && !ua.includes('iphone') && !ua.includes('ipad')) os = 'macOS';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) os = 'iOS';
  else if (ua.includes('linux')) os = 'Linux';

  // Determine Browser
  let browser = 'Unknown Browser';
  if (ua.includes('edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('chrome/') && !ua.includes('edg/')) browser = 'Google Chrome';
  else if (ua.includes('firefox/')) browser = 'Mozilla Firefox';
  else if (ua.includes('safari/') && !ua.includes('chrome/')) browser = 'Apple Safari';
  else if (ua.includes('opera') || ua.includes('opr/')) browser = 'Opera';

  // Determine Device category
  let device = 'Desktop';
  if (ua.includes('mobile') || ua.includes('iphone') || (ua.includes('android') && !ua.includes('tablet'))) {
    device = 'Mobile';
  } else if (ua.includes('ipad') || ua.includes('tablet')) {
    device = 'Tablet';
  }

  return { browser, os, device, ipAddress };
}
