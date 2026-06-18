import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Doctor from '../../models/Doctor';
import Appointment from '../../models/Appointment';
import Patient from '../../models/Patient';

const JWT_SECRET = process.env.JWT_SECRET || 'dental_secret_key_change_me_in_prod';

// Extract and verify patient from JWT token
function getPatientFromRequest(req: NextRequest): { patientId: string; telegramId: string } | null {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded || !decoded.patientId) return null;
    return {
      patientId: decoded.patientId,
      telegramId: decoded.telegramId,
    };
  } catch (err) {
    return null;
  }
}

// Fetch all appointments for a patient (GET) or Book an appointment (POST)
export async function GET(req: NextRequest) {
  try {
    const session = getPatientFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Sign-in via Telegram web app required.' }, { status: 401 });
    }

    // Return the patient's upcoming appointments
    const appointments = await Appointment.find({
      patientId: new mongoose.Types.ObjectId(session.patientId)
    })
      .populate('doctorId', 'name specialization department avatar')
      .sort({ date: 1, timeSlot: 1 });

    return NextResponse.json({ success: true, appointments });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error fetching appointments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getPatientFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Authenticated JWT token required.' }, { status: 401 });
    }

    const { doctorId, date, timeSlot, treatmentType, notes } = await req.json();

    // 1. Basic validation
    if (!doctorId || !date || !timeSlot || !treatmentType) {
      return NextResponse.json(
        { error: 'Missing fields. doctorId, date, timeSlot, and treatmentType are required' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return NextResponse.json({ error: 'Invalid doctorId format' }, { status: 400 });
    }

    // 2. Fetch doctor working hours and breaks
    const doctor = await Doctor.findById(doctorId);
    if (!doctor || !doctor.active) {
      return NextResponse.json({ error: 'Primary physician is inactive or does not exist' }, { status: 404 });
    }

    // 3. Time bounds & conflict check: check doctor schedule
    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date supplied' }, { status: 400 });
    }

    // Normalize date to midnight YYYY-MM-DD
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0,0,0,0);

    // Ensure the date is in future
    const today = new Date();
    today.setHours(0,0,0,0);
    if (normalizedDate < today) {
      return NextResponse.json({ error: 'Cannot book appointments in past dates' }, { status: 400 });
    }

    // Double check doctor-level collision - any overlapping slot
    const existingConflict = await Appointment.findOne({
      doctorId: new mongoose.Types.ObjectId(doctorId),
      date: normalizedDate,
      timeSlot: timeSlot,
      status: { $in: ['scheduled', 'completed'] } // Ignore cancelled ones
    });

    if (existingConflict) {
      return NextResponse.json(
        { error: 'Time slot conflict: Doctor has another booking at this exact time.' },
        { status: 409 }
      );
    }

    // Double check patient-level collision - patient shouldn't double-book separate doctors at the exact same hour
    const patientConflict = await Appointment.findOne({
      patientId: new mongoose.Types.ObjectId(session.patientId),
      date: normalizedDate,
      timeSlot: timeSlot,
      status: { $in: ['scheduled', 'completed'] }
    });

    if (patientConflict) {
      return NextResponse.json(
        { error: 'You are already booked for another appointment at this date and time slot.' },
        { status: 409 }
      );
    }

    // Create appointment!
    const newAppointment = await Appointment.create({
      doctorId: new mongoose.Types.ObjectId(doctorId),
      patientId: new mongoose.Types.ObjectId(session.patientId),
      date: normalizedDate,
      timeSlot,
      treatmentType,
      status: 'scheduled',
      notes: notes || '',
    });

    const appointmentDetails = await Appointment.findById(newAppointment._id)
      .populate('doctorId', 'name specialization department avatar')
      .populate('patientId', 'firstName lastName telegramId');

    return NextResponse.json({
      success: true,
      message: 'Appointment scheduled successfully',
      appointment: appointmentDetails,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failure creating meeting booking' }, { status: 500 });
  }
}
