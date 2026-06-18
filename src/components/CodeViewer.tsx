import React, { useState } from 'react';
import { Copy, Check, FileCode, CheckCircle2 } from 'lucide-react';

interface CodeFile {
  name: string;
  path: string;
  category: 'Models' | 'API Routes' | 'Telegram App SDK';
  code: string;
}

const FILES: CodeFile[] = [
  {
    name: 'Doctor.ts',
    path: 'src/nextjs/models/Doctor.ts',
    category: 'Models',
    code: `import mongoose, { Schema, Document } from 'mongoose';

export interface IDoctor extends Document {
  name: string;
  specialization: string;
  department: string;
  avatar?: string;
  email: string;
  experienceYears: number;
  workingHours: {
    start: string; // HH:MM, e.g. "09:00"
    end: string;   // HH:MM, e.g. "17:00"
  };
  breakTime?: {
    start: string; // HH:MM
    end: string;   // HH:MM
  };
  active: boolean;
}

const DoctorSchema: Schema = new Schema(
  {
    name: { type: String, required: [true, 'Doctor name is required'], trim: true },
    specialization: { type: String, required: [true, 'Specialization is required'], trim: true },
    department: { type: String, required: [true, 'Department is required'], trim: true },
    avatar: { type: String, default: '' },
    email: { 
      type: String, 
      required: [true, 'Email is required'], 
      unique: true, 
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'] 
    },
    experienceYears: { type: Number, required: true, min: 0 },
    workingHours: {
      start: { type: String, required: true, match: [/^([01]\\d|2[0-3]):([0-5]\\d)$/, 'Format HH:MM'] },
      end: { type: String, required: true, match: [/^([01]\\d|2[0-3]):([0-5]\\d)$/, 'Format HH:MM'] }
    },
    breakTime: {
      start: { type: String, match: [/^([01]\\d|2[0-3]):([0-5]\\d)$/, 'Format HH:MM'] },
      end: { type: String, match: [/^([01]\\d|2[0-3]):([0-5]\\d)$/, 'Format HH:MM'] }
    },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.models.Doctor || mongoose.model<IDoctor>('Doctor', DoctorSchema);`
  },
  {
    name: 'Patient.ts',
    path: 'src/nextjs/models/Patient.ts',
    category: 'Models',
    code: `import mongoose, { Schema, Document } from 'mongoose';

export interface IPatient extends Document {
  telegramId: string; // Key identifier for Telegram Mini App users
  username?: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  email?: string;
  birthDate?: Date;
  medicalNotes?: string;
}

const PatientSchema: Schema = new Schema(
  {
    telegramId: { type: String, required: true, unique: true, trim: true },
    username: { type: String, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true },
    phone: { type: String, match: [/^\\+?[1-9]\\d{1,14}$/, 'Invalid phone number'] },
    email: { type: String, lowercase: true, match: [/\\S+@\\S+\\.\\S+/, 'Invalid email'] },
    birthDate: { type: Date },
    medicalNotes: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.models.Patient || mongoose.model<IPatient>('Patient', PatientSchema);`
  },
  {
    name: 'Appointment.ts',
    path: 'src/nextjs/models/Appointment.ts',
    category: 'Models',
    code: `import mongoose, { Schema, Document } from 'mongoose';

export interface IAppointment extends Document {
  doctorId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  date: Date;
  timeSlot: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  treatmentType: string;
  notes?: string;
}

const AppointmentSchema: Schema = new Schema(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    date: { 
      type: Date, 
      required: true,
      validate: {
        validator: (val: Date) => {
          const today = new Date();
          today.setHours(0,0,0,0);
          return val >= today;
        },
        message: 'Appointment must be today or in the future'
      }
    },
    timeSlot: { type: String, required: true, match: [/^([01]\\d|2[0-3]):([0-5]\\d)$/, 'Format HH:MM'] },
    status: { 
      type: String, 
      enum: ['scheduled', 'completed', 'cancelled', 'no-show'], 
      default: 'scheduled' 
    },
    treatmentType: { type: String, required: true, trim: true },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

AppointmentSchema.index({ doctorId: 1, date: 1, timeSlot: 1, status: 1 });

export default mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', AppointmentSchema);`
  },
  {
    name: 'TelegramProvider.tsx',
    path: 'src/nextjs/providers/TelegramProvider.tsx',
    category: 'Telegram App SDK',
    code: `import React, { createContext, useContext, useEffect, useState } from 'react';
import { initMiniApp, initBackButton, initInitData } from '@telegram-apps/sdk-react';

interface TelegramContextType {
  initDataRaw?: string;
  user?: {
    id: number;
    firstName: string;
    lastName?: string;
    username?: string;
    languageCode?: string;
  };
  isReady: boolean;
}

const TelegramContext = createContext<TelegramContextType>({ isReady: false });

export const useTelegram = () => useContext(TelegramContext);

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TelegramContextType>({ isReady: false });

  useEffect(() => {
    try {
      // 1. Initialize Telegram Mini App SDK
      const [miniApp] = initMiniApp();
      miniApp.setHeaderColor('#FAF9F6');
      
      // 2. Extract initialized Launch parameters
      const initDataObj = initInitData();
      const user = initDataObj?.user;
      const initDataRaw = window.Telegram?.WebApp?.initData; // Read raw query string
      
      setState({
        initDataRaw,
        user: user ? {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          languageCode: user.languageCode,
        } : undefined,
        isReady: true,
      });

      // Show native Back Button in telegram iFrame
      const [backButton] = initBackButton();
      backButton.show();
    } catch (e) {
      console.warn("Could not load Telegram context. Outside Mini App SDK environment.");
      setState({ isReady: true });
    }
  }, []);

  return (
    <TelegramContext.Provider value={state}>
      {children}
    </TelegramContext.Provider>
  );
}`
  },
  {
    name: 'useTelegramUser.ts',
    path: 'src/nextjs/hooks/useTelegramUser.ts',
    category: 'Telegram App SDK',
    code: `import { useTelegram } from '../providers/TelegramProvider';

/**
 * Custom hook to extract active Telegram User metadata
 * Useful to pre-fill booking details inside the private dental practice form
 */
export function useTelegramUser() {
  const { user, initDataRaw, isReady } = useTelegram();

  return {
    isTelegramEnvironment: !!user,
    telegramId: user?.id,
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    username: user?.username || '',
    languageCode: user?.languageCode || '',
    initDataRaw,
    isReady
  };
}`
  },
  {
    name: 'validateInitData.ts',
    path: 'src/nextjs/utils/validateInitData.ts',
    category: 'Telegram App SDK',
    code: `import crypto from 'crypto';

/**
 * Validates the raw Telegram web app data (initData) signature.
 * Prevents unauthorized API requests outside Telegram iFrames by authenticating against your private Telegram Bot token.
 * 
 * @param initData The raw query string from Telegram.WebApp.initData
 * @param botToken The private Token retrieved from @BotFather in Telegram
 */
export function validateTelegramInitData(initData: string, botToken: string): boolean {
  if (!initData) return false;

  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  if (!hash) return false;

  // 1. Collect all query parameters except the signature check hash itself
  const dataKeys = Array.from(urlParams.keys())
    .filter((key) => key !== 'hash')
    .sort();

  // 2. Re-build the sorted key=value string format separated by newlines
  const dataCheckString = dataKeys
    .map((key) => \`\${key}=\${urlParams.get(key)}\`)
    .join('\\n');

  // 3. Perform verification:
  //    - secretKey = HMAC-SHA256("WebAppData", botToken)
  //    - calculatedHash = HMAC-SHA256(secretKey, dataCheckString)
  //    Compare calculated hash with parameter's supplied signature
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const expHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  return expHash === hash;
}`
  },
  {
    name: 'tgAuth.ts (Next.js)',
    path: 'app/api/auth/tg/route.ts',
    category: 'API Routes',
    code: `import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Patient from '../../../models/Patient';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const JWT_SECRET = process.env.JWT_SECRET!;

function verifyTelegramInitData(initData: string, botToken: string): boolean {
  if (!initData) return false;
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash')!;
  const dataKeys = Array.from(urlParams.keys()).filter((key) => key !== 'hash').sort();
  const dataCheckString = dataKeys.map((key) => \`\${key}=\${urlParams.get(key)}\`).join('\\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  return expHash === hash;
}

export async function POST(req: NextRequest) {
  try {
    const { initData } = await req.json();
    if (!verifyTelegramInitData(initData, TELEGRAM_BOT_TOKEN)) {
      return NextResponse.json({ error: 'Invalid authentication signature' }, { status: 401 });
    }

    const urlParams = new URLSearchParams(initData);
    const tgUser = JSON.parse(urlParams.get('user')!);

    let patient = await Patient.findOne({ telegramId: tgUser.id.toString() });
    if (!patient) {
      patient = await Patient.create({
        telegramId: tgUser.id.toString(),
        username: tgUser.username,
        firstName: tgUser.first_name,
        lastName: tgUser.last_name,
      });
    }

    const token = jwt.sign(
      { telegramId: patient.telegramId, patientId: patient._id.toString() },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({ success: true, token, patient });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}`
  },
  {
    name: 'slots.ts (Next.js)',
    path: 'app/api/slots/route.ts',
    category: 'API Routes',
    code: `import { NextRequest, NextResponse } from 'next/server';
import Doctor from '../../models/Doctor';
import Appointment from '../../models/Appointment';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get('doctorId')!;
    const dateStr = searchParams.get('date')!; // YYYY-MM-DD

    const doctor = await Doctor.findById(doctorId);
    if (!doctor || !doctor.active) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    const startMin = parseTimeToMinutes(doctor.workingHours.start);
    const endMin = parseTimeToMinutes(doctor.workingHours.end);
    const breakStart = doctor.breakTime ? parseTimeToMinutes(doctor.breakTime.start) : null;
    const breakEnd = doctor.breakTime ? parseTimeToMinutes(doctor.breakTime.end) : null;

    // Fetch overlapping bookings
    const bookings = await Appointment.find({
      doctorId,
      date: new Date(dateStr),
      status: { $ne: 'cancelled' }
    });
    const bookedTimes = bookings.map(b => b.timeSlot);

    const slots = [];
    for (let m = startMin; m < endMin; m += 30) {
      const slotTime = formatMinutesToTime(m);
      const isBreak = breakStart !== null && m >= breakStart && m < breakEnd!;
      const isBooked = bookedTimes.includes(slotTime);
      slots.push({
        time: slotTime,
        available: !isBreak && !isBooked
      });
    }

    return NextResponse.json({ slots });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function parseTimeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function formatMinutesToTime(m: number) {
  return \`\${Math.floor(m / 60).toString().padStart(2, '0')}:\${(m % 60).toString().padStart(2, '0')}\`;
}`
  },
  {
    name: 'book.ts (Next.js)',
    path: 'app/api/appointments/route.ts',
    category: 'API Routes',
    code: `import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import Appointment from '../../models/Appointment';

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('Authorization')!;
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const { doctorId, date, timeSlot, treatmentType, notes } = await req.json();

    // 1. Conflict check: doctor schedule overlapping
    const conflict = await Appointment.findOne({
      doctorId,
      date: new Date(date),
      timeSlot,
      status: { $in: ['scheduled', 'completed'] }
    });
    if (conflict) {
      return NextResponse.json({ error: 'Time slot conflict!' }, { status: 409 });
    }

    // 2. Patient schedule overlapping
    const patientConflict = await Appointment.findOne({
      patientId: decoded.patientId,
      date: new Date(date),
      timeSlot,
      status: { $in: ['scheduled', 'completed'] }
    });
    if (patientConflict) {
      return NextResponse.json({ error: 'Double book warning!' }, { status: 409 });
    }

    const appointment = await Appointment.create({
      doctorId,
      patientId: decoded.patientId,
      date: new Date(date),
      timeSlot,
      treatmentType,
      notes
    });

    return NextResponse.json({ success: true, appointment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 405 });
  }
}`
  },
  {
    name: 'status.ts (Next.js)',
    path: 'app/api/appointments/status/route.ts',
    category: 'API Routes',
    code: `import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import Appointment from '../../../models/Appointment';

export async function PATCH(req: NextRequest) {
  try {
    const auth = req.headers.get('Authorization')!;
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const { appointmentId, status } = await req.json();

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (appointment.patientId.toString() !== decoded.patientId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    appointment.status = status;
    await appointment.save();

    return NextResponse.json({ success: true, appointment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}`
  }
];

export default function CodeViewer() {
  const [activeTab, setActiveTab] = useState<string>(FILES[0].name);
  const [copied, setCopied] = useState<boolean>(false);

  const activeFile = FILES.find((f) => f.name === activeTab) || FILES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#FAF9F6] border border-[#EBE8E0] rounded-lg shadow-sm overflow-hidden flex flex-col md:flex-row h-[550px]">
      {/* File sidebar selection list */}
      <div className="w-full md:w-60 bg-white border-b md:border-b-0 md:border-r border-[#EBE8E0] p-4 flex flex-col space-y-4 overflow-y-auto">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#9E9B95]">MongoDB Schemas</span>
          <div className="mt-2 space-y-1">
            {FILES.filter((f) => f.category === 'Models').map((f) => (
              <button
                key={f.name}
                onClick={() => {
                  setActiveTab(f.name);
                  setCopied(false);
                }}
                className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors flex items-center space-x-2 ${
                  activeTab === f.name
                    ? 'bg-lavender-100 text-[#493E7D] font-medium'
                    : 'text-[#5E5B55] hover:bg-lavender-50'
                }`}
              >
                <FileCode className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{f.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#9E9B95]">Telegram App SDK</span>
          <div className="mt-2 space-y-1">
            {FILES.filter((f) => f.category === 'Telegram App SDK').map((f) => (
              <button
                key={f.name}
                onClick={() => {
                  setActiveTab(f.name);
                  setCopied(false);
                }}
                className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors flex items-center space-x-2 ${
                  activeTab === f.name
                    ? 'bg-lavender-100 text-[#493E7D] font-medium'
                    : 'text-[#5E5B55] hover:bg-lavender-50'
                }`}
              >
                <FileCode className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{f.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#9E9B95]">Next.js API Routes</span>
          <div className="mt-2 space-y-1">
            {FILES.filter((f) => f.category === 'API Routes').map((f) => (
              <button
                key={f.name}
                onClick={() => {
                  setActiveTab(f.name);
                  setCopied(false);
                }}
                className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors flex items-center space-x-2 ${
                  activeTab === f.name
                    ? 'bg-lavender-100 text-[#493E7D] font-medium'
                    : 'text-[#5E5B55] hover:bg-lavender-50'
                }`}
              >
                <FileCode className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{f.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Editor Main Section */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-[#FAF9F6] border-b border-[#EBE8E0] px-4 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-[#5E5B55]">
            <span className="font-mono text-[11px] font-semibold bg-white border border-[#EBE8E0] px-2 py-0.5 rounded text-[#493E7D]">
              {activeFile.path}
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-white hover:bg-lavender-50 border border-[#EBE8E0] transition-colors text-xs text-[#5E5B55] hover:text-[#493E7D]"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-green-600" />
                <span className="text-green-600 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content Block */}
        <div className="flex-1 overflow-auto p-4 bg-white">
          <pre className="font-mono text-xs text-[#2B2925] leading-relaxed whitespace-pre select-all">
            {activeFile.code}
          </pre>
        </div>
      </div>
    </div>
  );
}
