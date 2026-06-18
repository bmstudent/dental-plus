import mongoose, { Schema, Document } from 'mongoose';

export interface IAppointment extends Document {
  doctorId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  date: Date;          // Appointment date (YYYY-MM-DD or full Date, but stored as Date object representing custom midnight)
  timeSlot: string;    // HH:MM format (matching slot start, e.g., "10:30")
  durationMinutes: number; // e.g. 30 or 60 minutes
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  treatmentType: string;
  notes?: string;
}

const AppointmentSchema: Schema = new Schema(
  {
    doctorId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Doctor', 
      required: [true, 'Doctor reference is required'] 
    },
    patientId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Patient', 
      required: [true, 'Patient reference is required'] 
    },
    date: { 
      type: Date, 
      required: [true, 'Appointment date is required'],
      validate: {
        validator: function(value: Date) {
          // Normalize today's date to midnight for date-only comparison
          const today = new Date();
          today.setHours(0,0,0,0);
          return value >= today;
        },
        message: 'Appointment date must be today or in the future'
      }
    },
    timeSlot: { 
      type: String, 
      required: [true, 'Time slot is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time slot must be in HH:MM format'] 
    },
    durationMinutes: { 
      type: Number, 
      default: 30,
      min: [15, 'Minimum appointment slot is 15 minutes'],
      max: [180, 'Maximum appointment slot is 3 hours']
    },
    status: { 
      type: String, 
      enum: {
        values: ['scheduled', 'completed', 'cancelled', 'no-show'],
        message: '{VALUE} is not a valid appointment status'
      },
      default: 'scheduled' 
    },
    treatmentType: { 
      type: String, 
      required: [true, 'Treatment/consultation type is required'],
      trim: true 
    },
    notes: { 
      type: String,
      default: '' 
    }
  },
  { 
    timestamps: true 
  }
);

// Compound index to speed up conflict-checking queries and enforce integrity
// (Doctor + Date + TimeSlot leads to an efficient unique check, though cancelled ones can overlap)
AppointmentSchema.index({ doctorId: 1, date: 1, timeSlot: 1, status: 1 });

export default mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', AppointmentSchema);
