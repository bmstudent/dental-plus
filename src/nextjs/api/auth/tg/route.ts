import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Patient from '../../../models/Patient'; // Paths relative to NEXTJS app structure (app/api/auth/tg/route.ts)

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'MOCK_BOT_TOKEN_FOR_DEV';
const JWT_SECRET = process.env.JWT_SECRET || 'dental_secret_key_change_me_in_prod';

/**
 * Validates the raw Telegram web app data (initData) signature.
 * @param initData The raw query string from Telegram.WebApp.initData
 * @param botToken The bot token from BotFather
 */
function verifyTelegramInitData(initData: string, botToken: string): boolean {
  if (!initData) return false;

  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  if (!hash) return false;

  // Collect all query parameters except hash, sort alphabetically
  const dataKeys = Array.from(urlParams.keys())
    .filter((key) => key !== 'hash')
    .sort();

  // Re-build standard query string with sorted key=value lines
  const dataCheckString = dataKeys
    .map((key) => `${key}=${urlParams.get(key)}`)
    .join('\n');

  // HMACS:
  // 1. secret = HMAC-SHA256("WebAppData", botToken)
  // 2. calculated_hash = HMAC-SHA256(secret, dataCheckString)
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const expHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  return expHash === hash;
}

export async function POST(req: NextRequest) {
  try {
    const { initData, mockUser } = await req.json();

    // In local development we want to support testing without a real TG active iframe.
    // We check if BOT_TOKEN is dummy / default, allowing a developer bypass.
    let isValid = false;
    let tgUser: any = null;

    if (TELEGRAM_BOT_TOKEN === 'MOCK_BOT_TOKEN_FOR_DEV' && mockUser) {
      // Bypass verification for developer comfort (local simulated login)
      isValid = true;
      tgUser = mockUser;
    } else {
      isValid = verifyTelegramInitData(initData, TELEGRAM_BOT_TOKEN);
      if (isValid) {
        // Parse user field from initData
        const urlParams = new URLSearchParams(initData);
        const userJson = urlParams.get('user');
        if (userJson) {
          tgUser = JSON.parse(userJson);
        }
      }
    }

    if (!isValid || !tgUser) {
      return NextResponse.json(
        { error: 'Invalid Telegram Authenticity Signature or user details' },
        { status: 401 }
      );
    }

    // Upsert Patient in MongoDB representing this Telegram User
    let patient = await Patient.findOne({ telegramId: tgUser.id.toString() });
    if (!patient) {
      patient = await Patient.create({
        telegramId: tgUser.id.toString(),
        username: tgUser.username || '',
        firstName: tgUser.first_name || 'Anonymous',
        lastName: tgUser.last_name || '',
        phone: tgUser.phone_number || '', // If available
      });
    }

    // Sign JWT Token
    const payload = {
      telegramId: patient.telegramId,
      patientId: patient._id.toString(),
      firstName: patient.firstName,
      username: patient.username,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    return NextResponse.json({
      success: true,
      token,
      patient: {
        id: patient._id,
        telegramId: patient.telegramId,
        firstName: patient.firstName,
        lastName: patient.lastName,
        username: patient.username,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Auth execution failure' }, { status: 500 });
  }
}
