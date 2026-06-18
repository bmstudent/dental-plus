import mongoose, { Schema, Document } from 'mongoose';

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
    telegramId: { 
      type: String, 
      required: [true, 'Telegram ID is required'], 
      unique: true, 
      trim: true 
    },
    username: { 
      type: String, 
      trim: true 
    },
    firstName: { 
      type: String, 
      required: [true, 'First name is required'],
      trim: true 
    },
    lastName: { 
      type: String, 
      trim: true 
    },
    phone: { 
      type: String, 
      trim: true,
      match: [/^\+?[1-9]\d{1,14}$/, 'Please use a valid E.164 phone number pattern']
    },
    email: { 
      type: String, 
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'] 
    },
    birthDate: { 
      type: Date 
    },
    medicalNotes: { 
      type: String,
      default: '' 
    }
  },
  { 
    timestamps: true 
  }
);

export default mongoose.models.Patient || mongoose.model<IPatient>('Patient', PatientSchema);
