import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Doctor from '../../models/Doctor';
import Appointment from '../../models/Appointment';

// Help parse HH:MM to numerical minutes since midnight
function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Convert minutes back to HH:MM format
function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const hStr = hours.toString().padStart(2, '0');
  const mStr = mins.toString().padStart(2, '0');
  return `${hStr}:${mStr}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get('doctorId');
    const dateStr = searchParams.get('date'); // Expecting format YYYY-MM-DD

    if (!doctorId || !dateStr) {
      return NextResponse.json(
        { error: 'Missing parameters: doctorId and date are required' },
        { status: 400 }
      );
    }

    // Verify valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return NextResponse.json({ error: 'Invalid doctor ID format' }, { status: 400 });
    }

    // Find Doctor
    const doctor = await Doctor.findById(doctorId);
    if (!doctor || !doctor.active) {
      return NextResponse.json({ error: 'Doctor not found or inactive' }, { status: 404 });
    }

    // Parse requested date
    const selectedDate = new Date(dateStr);
    if (isNaN(selectedDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 });
    }

    // Setup working limits
    const startMinutes = parseTimeToMinutes(doctor.workingHours.start);
    const endMinutes = parseTimeToMinutes(doctor.workingHours.end);
    const breakStart = doctor.breakTime ? parseTimeToMinutes(doctor.breakTime.start) : null;
    const breakEnd = doctor.breakTime ? parseTimeToMinutes(doctor.breakTime.end) : null;

    // Generate every 30-minute interval within working hours
    const slots: { time: string; available: boolean; isBreak: boolean }[] = [];
    const intervalMinutes = 30;

    // Fetch existing booked appointments for the doctor on this date
    // Normalize date to midnight to match
    const searchDateStart = new Date(dateStr);
    searchDateStart.setHours(0,0,0,0);
    const searchDateEnd = new Date(dateStr);
    searchDateEnd.setHours(23,59,59,999);

    const bookedAppointments = await Appointment.find({
      doctorId: new mongoose.Types.ObjectId(doctorId),
      date: {
        $gte: searchDateStart,
        $lte: searchDateEnd
      },
      status: { $ne: 'cancelled' } // Ignore cancelled slots
    });

    const bookedSlotsList = bookedAppointments.map((app) => app.timeSlot);

    for (let m = startMinutes; m < endMinutes; m += intervalMinutes) {
      const slotTime = formatMinutesToTime(m);
      
      // Check if slot falls in general break time
      let inBreak = false;
      if (breakStart !== null && breakEnd !== null) {
        if (m >= breakStart && m < breakEnd) {
          inBreak = true;
        }
      }

      // Check if already booked
      const isBooked = bookedSlotsList.includes(slotTime);

      slots.push({
        time: slotTime,
        available: !inBreak && !isBooked,
        isBreak: inBreak,
      });
    }

    return NextResponse.json({
      doctorId,
      date: dateStr,
      workingHours: doctor.workingHours,
      slots,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error compiling slot schedules' }, { status: 500 });
  }
}
