// Mock MongoDB/Mongoose database simulating the doctor schedules, patients, and bookings
export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  department: string;
  avatar: string;
  email: string;
  experienceYears: number;
  workingHours: { start: string; end: string };
  breakTime: { start: string; end: string };
  rating: number;
  reviewsCount: number;
}

export interface Patient {
  id: string;
  telegramId: string;
  username: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  joinedAt: Date;
}

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  date: string; // "YYYY-MM-DD"
  timeSlot: string; // "HH:MM"
  durationMinutes: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  treatmentType: string;
  notes: string;
}

// Initial seed data
export let Doctors: Doctor[] = [
  {
    id: "doc-1",
    name: "Dr. Johan Smit",
    specialization: "Cosmetic dentistry",
    department: "Oral Hygiene Checkup",
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200&h=200",
    email: "dr.johan@maison-dentiste.ch",
    experienceYears: 5,
    workingHours: { start: "09:00", end: "17:00" },
    breakTime: { start: "12:00", end: "13:00" },
    rating: 4.2,
    reviewsCount: 84
  },
  {
    id: "doc-2",
    name: "Dr. Riya Dasli",
    specialization: "Dental Orthodontics Checkup",
    department: "Esthetics & Alignment",
    avatar: "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=200&h=200",
    email: "dr.riya@maison-dentiste.ch",
    experienceYears: 12,
    workingHours: { start: "08:30", end: "16:30" },
    breakTime: { start: "12:30", end: "13:30" },
    rating: 4.8,
    reviewsCount: 154
  },
  {
    id: "doc-3",
    name: "Dr. Bernard Bliss",
    specialization: "Oral hygiene",
    department: "Preventative Suite",
    avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200&h=200",
    email: "dr.bernard@maison-dentiste.ch",
    experienceYears: 8,
    workingHours: { start: "10:00", end: "18:00" },
    breakTime: { start: "13:00", end: "14:00" },
    rating: 4.9,
    reviewsCount: 112
  },
  {
    id: "doc-4",
    name: "Dr. Frida Park",
    specialization: "Oral hygiene",
    department: "General Dentistry",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200&h=200",
    email: "dr.frida@maison-dentiste.ch",
    experienceYears: 6,
    workingHours: { start: "09:00", end: "17:00" },
    breakTime: { start: "12:00", end: "13:00" },
    rating: 4.7,
    reviewsCount: 96
  },
  {
    id: "doc-5",
    name: "Dr. Shianauya",
    specialization: "Dental Orthodontics",
    department: "Alignment & Braces",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200",
    email: "dr.shianauya@maison-dentiste.ch",
    experienceYears: 9,
    workingHours: { start: "09:30", end: "17:30" },
    breakTime: { start: "13:30", end: "14:30" },
    rating: 4.8,
    reviewsCount: 140
  },
  {
    id: "doc-6",
    name: "Dr. Dibling Smit",
    specialization: "Dental Orthodontics",
    department: "Oral Surgery & Prosthetics",
    avatar: "https://images.unsplash.com/photo-1582750433449-649350141f2f?auto=format&fit=crop&q=80&w=200&h=200",
    email: "dr.dibling@maison-dentiste.ch",
    experienceYears: 14,
    workingHours: { start: "08:00", end: "16:00" },
    breakTime: { start: "12:00", end: "13:00" },
    rating: 4.9,
    reviewsCount: 220
  }
];

export let Patients: Patient[] = [
  {
    id: "pat-1",
    telegramId: "12345678",
    username: "temur_dental",
    firstName: "Temur",
    lastName: "Alimov",
    phone: "+998901234567",
    email: "temur@example.com",
    joinedAt: new Date()
  }
];

export let Appointments: Appointment[] = [
  {
    id: "app-1",
    doctorId: "doc-1",
    patientId: "pat-1",
    date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // 2 days from now
    timeSlot: "11:00",
    durationMinutes: 30,
    status: "scheduled",
    treatmentType: "Orthodontic Adjustment",
    notes: "Checking tension on bottom braces model"
  }
];

// Memory Database Utility Helper functions
export const getSlotsForDoctor = (doctorId: string, dateStr: string) => {
  const doctor = Doctors.find(d => d.id === doctorId);
  if (!doctor) return null;

  const startMin = parseTimeToMinutes(doctor.workingHours.start);
  const endMin = parseTimeToMinutes(doctor.workingHours.end);
  const breakStart = parseTimeToMinutes(doctor.breakTime.start);
  const breakEnd = parseTimeToMinutes(doctor.breakTime.end);

  const activeBookings = Appointments.filter(
    app => app.doctorId === doctorId && app.date === dateStr && app.status !== "cancelled"
  );
  const bookedSlots = activeBookings.map(app => app.timeSlot);

  const slots: { time: string; available: boolean; isBreak: boolean }[] = [];
  const step = 30; // 30 mins each

  for (let m = startMin; m < endMin; m += step) {
    const slotTime = formatMinutesToTime(m);
    const inBreak = m >= breakStart && m < breakEnd;
    const isBooked = bookedSlots.includes(slotTime);

    slots.push({
      time: slotTime,
      available: !inBreak && !isBooked,
      isBreak: inBreak
    });
  }

  return {
    doctorId,
    date: dateStr,
    slots
  };
};

export const bookAppointment = (data: {
  doctorId: string;
  patientId: string;
  date: string;
  timeSlot: string;
  treatmentType: string;
  notes?: string;
}) => {
  // 1. Validation
  const doctor = Doctors.find(d => d.id === data.doctorId);
  if (!doctor) {
    return { error: "Physician not found." };
  }

  // Ensure and validate schedule is open
  const slotsData = getSlotsForDoctor(data.doctorId, data.date);
  if (!slotsData) return { error: "Unable to calculate doctor schedule." };

  const parsedSlot = slotsData.slots.find(s => s.time === data.timeSlot);
  if (!parsedSlot) {
    return { error: "Selected slot time does not fit doctor work window." };
  }
  if (!parsedSlot.available) {
    return { error: parsedSlot.isBreak ? "Physician is on lunch recess during selected time" : "Time slot conflict: Coach has another scheduled booking." };
  }

  // 2. Patient duplication overlap block
  const patientConflict = Appointments.find(
    app => app.patientId === data.patientId && app.date === data.date && app.timeSlot === data.timeSlot && app.status !== "cancelled"
  );
  if (patientConflict) {
    return { error: "You already have another booked dental treatment scheduled at this identical hour." };
  }

  // Book
  const newApp: Appointment = {
    id: `app-${Date.now()}`,
    doctorId: data.doctorId,
    patientId: data.patientId,
    date: data.date,
    timeSlot: data.timeSlot,
    durationMinutes: 30,
    status: 'scheduled',
    treatmentType: data.treatmentType,
    notes: data.notes || ""
  };

  Appointments.push(newApp);
  return { success: true, appointment: newApp };
};

export const updateAppointmentStatus = (id: string, patientId: string, status: any) => {
  const app = Appointments.find(a => a.id === id);
  if (!app) return { error: "Appointment not found" };

  if (app.patientId !== patientId) {
    return { error: "Unauthorized access list" };
  }

  app.status = status;
  return { success: true, appointment: app };
};

// Internal conversion functions
function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const hStr = hours.toString().padStart(2, '0');
  const mStr = mins.toString().padStart(2, '0');
  return `${hStr}:${mStr}`;
}
