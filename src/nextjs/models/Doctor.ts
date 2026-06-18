import mongoose, { Schema, Document } from 'mongoose';

export interface IDoctor extends Document {
  name: string;
  specialization: string;
  department: string;
  avatar?: string;
  email: string;
  experienceYears: number;
  workingHours: {
    start: string; // HH:MM format, e.g., "09:00"
    end: string;   // HH:MM format, e.g., "17:00"
  };
  breakTime?: {
    start: string; // HH:MM, e.g., "13:00"
    end: string;   // HH:MM, e.g., "14:00"
  };
  active: boolean;
}

const DoctorSchema: Schema = new Schema(
  {
    name: { 
      type: String, 
      required: [true, 'Doctor name is required'],
      trim: true 
    },
    specialization: { 
      type: String, 
      required: [true, 'Specialization is required'],
      trim: true 
    },
    department: { 
      type: String, 
      required: [true, 'Department is required'],
      trim: true 
    },
    avatar: { 
      type: String,
      default: ''
    },
    email: { 
      type: String, 
      required: [true, 'Email is required'], 
      unique: true, 
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'] 
    },
    experienceYears: { 
      type: Number, 
      required: [true, 'Years of experience is required'],
      min: [0, 'Experience years cannot be negative'] 
    },
    workingHours: {
      start: { 
        type: String, 
        required: [true, 'Working hours start is required'],
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:MM'] 
      },
      end: { 
        type: String, 
        required: [true, 'Working hours end is required'],
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:MM'] 
      }
    },
    breakTime: {
      start: { 
        type: String, 
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:MM'] 
      },
      end: { 
        type: String, 
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:MM'] 
      }
    },
    active: { 
      type: Boolean, 
      default: true 
    }
  },
  { 
    timestamps: true 
  }
);

// Prevent compiling model multiple times during Next.js Hot Module Replacement
export default mongoose.models.Doctor || mongoose.model<IDoctor>('Doctor', DoctorSchema);
