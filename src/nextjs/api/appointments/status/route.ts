import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Appointment from '../../../models/Appointment';

const JWT_SECRET = process.env.JWT_SECRET || 'dental_secret_key_change_me_in_prod';

function getPatientIdFromRequest(req: NextRequest): string | null {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded?.patientId || null;
  } catch {
    return null;
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const patientId = getPatientIdFromRequest(req);
    if (!patientId) {
      return NextResponse.json({ error: 'Unauthorized. Authenticated session is required.' }, { status: 401 });
    }

    const { appointmentId, status } = await req.json();

    if (!appointmentId || !status) {
      return NextResponse.json({ error: 'Missing parameters: appointmentId and status are required' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return NextResponse.json({ error: 'Invalid appointment ID format' }, { status: 400 });
    }

    // Validate the status transitions
    const validStatuses = ['scheduled', 'completed', 'cancelled', 'no-show'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    // Find the appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment record not found' }, { status: 404 });
    }

    // Security Gate: Ensure this patient actually owns the appointment they are modifying
    if (appointment.patientId.toString() !== patientId) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permissions to modify another patient\'s appointment' },
        { status: 403 }
      );
    }

    // Patient is mainly authorized to cancel of their own accord. 
    // They are not able to mark their own appointments as 'completed' or 'no-show' in real-world clinic workflows,
    // although we let the status pass if the request fits. Let's add that neat logical check!
    if ((status === 'completed' || status === 'no-show') && process.env.NODE_ENV === 'production') {
       return NextResponse.json(
         { error: 'Forbidden: Only clinic medical staff can mark appointments as completed or no-show.' },
         { status: 403 }
       );
    }

    // Update status
    appointment.status = status;
    await appointment.save();

    // Populate doctor details before responding
    const updatedDetails = await Appointment.findById(appointmentId)
      .populate('doctorId', 'name specialization department avatar')
      .populate('patientId', 'firstName lastName');

    return NextResponse.json({
      success: true,
      message: `Appointment status updated to '${status}' successfully`,
      appointment: updatedDetails
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error processing status change request' }, { status: 500 });
  }
}
