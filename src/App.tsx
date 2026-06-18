import React, { useState, useEffect, useMemo } from 'react';
import { 
  Heart, 
  Search, 
  Bell, 
  Clock, 
  MessageSquare, 
  PhoneCall, 
  ChevronRight, 
  ChevronLeft,
  MoreVertical,
  Volume2,
  VolumeX,
  X,
  Trash2,
  Sparkles,
  Star,
  Video,
  Check,
  User,
  Sliders,
  Calendar,
  Sparkle,
  Activity,
  Award,
  CircleDot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Interfaces for clean data synchronization
interface Doctor {
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

interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  date: string;
  timeSlot: string;
  durationMinutes: number;
  status: 'scheduled' | 'cancelled';
  treatmentType: string;
  notes: string;
}

// Clinically tuned acoustic synthesizers using Web Audio API for tactical medical terminal feel
const triggerQuantumSound = (type: 'book' | 'cancel' | 'click' | 'success') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    if (type === 'book') {
      const freqs = [329.63, 392.00, 523.25, 659.25];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.06);
        gain.gain.setValueAtTime(0.015, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.25);
      });
    } else if (type === 'cancel') {
      [392.00, 311.13, 233.08].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + i * 0.08);
        gain.gain.setValueAtTime(0.015, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.22);
      });
    } else if (type === 'success') {
      [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.05);
        gain.gain.setValueAtTime(0.02, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.3);
      });
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(950, now);
      gain.gain.setValueAtTime(0.008, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    }
  } catch (err) {
    // Fail silently
  }
};

const FALLBACK_DOCTORS: Doctor[] = [
  {
    id: "doc-1",
    name: "Dr. Johan smit",
    specialization: "Cosmetic dentistry",
    department: "Cosmetic Dentistry Suite",
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=350&h=450",
    email: "dr.johan@maison-dentiste.ch",
    experienceYears: 5,
    workingHours: { start: "09:00", end: "17:00" },
    breakTime: { start: "12:00", end: "13:00" },
    rating: 4.8,
    reviewsCount: 84
  },
  {
    id: "doc-2",
    name: "Dr. Riya Dasli",
    specialization: "Dental Orthodontics Checkup",
    department: "Esthetics Clinic",
    avatar: "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=350&h=450",
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
    avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=260&h=260",
    email: "dr.bernard@maison-dentiste.ch",
    experienceYears: 8,
    workingHours: { start: "09:00", end: "17:30" },
    breakTime: { start: "12:00", end: "13:05" },
    rating: 4.9,
    reviewsCount: 112
  },
  {
    id: "doc-4",
    name: "Dr. Frida Park",
    specialization: "Oral hygiene",
    department: "Biological General Unit",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=260&h=260",
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
    department: "Precision Alignments Laboratory",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=260&h=260",
    email: "dr.shianauya@maison-dentiste.ch",
    experienceYears: 9,
    workingHours: { start: "09:30", end: "18:00" },
    breakTime: { start: "13:00", end: "14:00" },
    rating: 4.8,
    reviewsCount: 140
  },
  {
    id: "doc-6",
    name: "Dr. Dibling Smit",
    specialization: "Dental Orthodontics",
    department: "Precision Alignments",
    avatar: "https://images.unsplash.com/photo-1582750433449-649350141f2f?auto=format&fit=crop&q=80&w=260&h=260",
    email: "dr.dibling@maison-dentiste.ch",
    experienceYears: 14,
    workingHours: { start: "08:30", end: "16:30" },
    breakTime: { start: "12:00", end: "13:00" },
    rating: 4.9,
    reviewsCount: 220
  }
];

const TOOTH_ZONES_MAP: Record<string, { name: string; status: 'healthy' | 'caution' | 'checkup' | 'warning'; shade: string; diagnosis: string; recommendation: string; referralDocId: string; treatment: string }> = {
  'U1': {
    name: 'Upper Incisors (Front Zone)',
    status: 'healthy',
    shade: 'A1 (Perfect Core)',
    diagnosis: 'Zero active structural anomalies spotted. Enamel retention rating remains 98%.',
    recommendation: 'Continue daily mineral care rinses.',
    referralDocId: 'doc-1',
    treatment: 'Aesthetic Teeth Whitening'
  },
  'U3': {
    name: 'Upper Right Premolars',
    status: 'caution',
    shade: 'A2 (Natural)',
    diagnosis: 'Slight soft plaque collection detected near bordering gum margins.',
    recommendation: 'Ultrasonic calculus scaling and prophylaxis recommended.',
    referralDocId: 'doc-3',
    treatment: 'Deep Scale & Fluoride Cleaning'
  },
  'U8': {
    name: 'Upper Left Molars',
    status: 'checkup',
    shade: 'A3 (Stained)',
    diagnosis: 'Partial impaction of wisdom tooth #16 observed on digital scan.',
    recommendation: 'Clinical diagnostic consultation and surgical assessment suggested.',
    referralDocId: 'doc-1',
    treatment: 'General Consultation & Diagnosis'
  },
  'L4': {
    name: 'Lower Left Molars',
    status: 'warning',
    shade: 'A3.5 (Heavy Stains)',
    diagnosis: 'Primary fissure enamel shadowing mapped under tooth #18.',
    recommendation: 'Prompt appointment for micro composite laser filling advised.',
    referralDocId: 'doc-4',
    treatment: 'General Consultation & Diagnosis'
  },
  'L2': {
    name: 'Lower Canines (Bite Anchors)',
    status: 'healthy',
    shade: 'A1.5',
    diagnosis: 'Bite pressure vector balanced perfectly. Zero bone loss.',
    recommendation: 'Retainer verification check during next routine review.',
    referralDocId: 'doc-2',
    treatment: 'Orthodontic Adjustment (Braces)'
  }
};

export default function App() {
  // Navigation
  const [currentView, setCurrentView] = useState<'home' | 'search' | 'detail'>('home');
  const [prevView, setPrevView] = useState<'home' | 'search'>('home');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor>(FALLBACK_DOCTORS[0]);

  // General App states
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [toast, setToast] = useState<{ type: 'success' | 'alert' | 'clinical'; text: string } | null>(null);
  const [authToken, setAuthToken] = useState<string>(() => localStorage.getItem('tg_mini_app_token') || '');
  const [patient, setPatient] = useState<{ id: string; telegramId: string; firstName: string; lastName: string; phone?: string; username?: string } | null>(null);
  
  // Lists
  const [doctors, setDoctors] = useState<Doctor[]>(FALLBACK_DOCTORS);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  // Date-Time states
  const [selectedMainDate, setSelectedMainDate] = useState<string>('2025-02-15');
  const [detailSelectedDate, setDetailSelectedDate] = useState<string>('2025-02-22');
  const [detailSelectedTime, setDetailSelectedTime] = useState<string>('08:00');

  // Search, Categories, Bookmarks
  const [selectedCategory, setSelectedCategory] = useState<string>('Braces');
  const [localSearch, setLocalSearch] = useState<string>('');
  const [likedDoctors, setLikedDoctors] = useState<string[]>(['doc-1', 'doc-2']);
  const [showBookedModal, setShowBookedModal] = useState<boolean>(false);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState<boolean>(false);

  // Advanced Filters
  const [ratingRange, setRatingRange] = useState<number>(4.5);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('All');

  // Interactive Telegram bot simulation state
  const [simFirstName, setSimFirstName] = useState<string>('Antony');
  const [simLastName, setSimLastName] = useState<string>('Parker');
  const [simPhone, setSimPhone] = useState<string>('+33 6 1234 5678');
  const [simUsername, setSimUsername] = useState<string>('antony_p_dentist');
  const [showBotSandbox, setShowBotSandbox] = useState<boolean>(false);

  // Interactive Diagnostic Assistant states
  const [showDentalAssistant, setShowDentalAssistant] = useState<boolean>(false);
  const [assistantStep, setAssistantStep] = useState<number>(1);
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [dentalSymptom, setDentalSymptom] = useState<string>('');
  const [painScale, setPainScale] = useState<number>(5);
  const [diagnosticResult, setDiagnosticResult] = useState<{ specialization: string; message: string; docId: string } | null>(null);
  const [selectedToothZone, setSelectedToothZone] = useState<string>('U1');

  const triggerAudio = (type: 'book' | 'cancel' | 'click' | 'success') => {
    if (soundEnabled) {
      triggerQuantumSound(type);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/doctors');
      if (res.ok) {
        const data = await res.json();
        const serverDocs = data.doctors || [];
        setDoctors(prev => {
          const merged = [...serverDocs];
          FALLBACK_DOCTORS.forEach(seed => {
            if (!merged.some(m => m.id === seed.id)) {
              merged.push(seed);
            }
          });
          return merged;
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAppointments = async () => {
    if (!authToken) return;
    try {
      const res = await fetch('/api/appointments', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        const raw = data.appointments || [];
        const normalized = raw.map((app: any) => ({
          id: app.id,
          doctorId: typeof app.doctorId === 'object' && app.doctorId !== null ? app.doctorId.id : app.doctorId,
          patientId: app.patientId,
          date: app.date,
          timeSlot: app.timeSlot,
          durationMinutes: app.durationMinutes,
          status: app.status,
          treatmentType: app.treatmentType,
          notes: app.notes || ''
        }));
        setAppointments(normalized);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPatientProfile = async (token: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.patient) {
          setPatient(data.patient);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const authenticateTelegramUser = async () => {
    try {
      // Check for real Telegram WebApp context
      const tgWebApp = (window as any).Telegram?.WebApp;
      const initData = tgWebApp?.initData;

      if (initData) {
        const res = await fetch('/api/auth/tg', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.token) {
            localStorage.setItem('tg_mini_app_token', data.token);
            setAuthToken(data.token);
            setPatient(data.patient);
            return;
          }
        }
      }

      // Check URL search parameters or query strings for Telegram WebApp environment setup
      const urlParams = new URLSearchParams(window.location.search);
      const queryInitData = urlParams.get('tgWebAppData');
      if (queryInitData) {
        const res = await fetch('/api/auth/tg', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: queryInitData })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.token) {
            localStorage.setItem('tg_mini_app_token', data.token);
            setAuthToken(data.token);
            setPatient(data.patient);
            return;
          }
        }
      }

      // Fallback 1: localStorage
      const savedToken = localStorage.getItem('tg_mini_app_token');
      if (savedToken) {
        setAuthToken(savedToken);
        await fetchPatientProfile(savedToken);
        return;
      }

      // Fallback 2: Mock preview environment
      const mockPayload = { id: '561691', first_name: 'Antony', username: 'antony_p_dentist' };
      const res = await fetch('/api/auth/tg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mockUser: mockPayload })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.token) {
          localStorage.setItem('tg_mini_app_token', data.token);
          setAuthToken(data.token);
          setPatient(data.patient);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSimulatedRegistration = async () => {
    triggerAudio('click');
    if (!simFirstName.trim() || !simLastName.trim() || !simPhone.trim()) {
      setToast({
        type: 'alert',
        text: '⚠️ First Name, Surname, and Phone are required for Sandbox Sync!'
      });
      return;
    }

    try {
      const mockPayload = {
        id: '561691', // Standard demo ID so updates overlay cleanly on active patient account
        first_name: simFirstName.trim(),
        last_name: simLastName.trim(),
        phone: simPhone.trim(),
        username: simUsername.trim() || 'tg_sandbox_user'
      };

      const res = await fetch('/api/auth/tg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mockUser: mockPayload })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.token) {
          localStorage.setItem('tg_mini_app_token', data.token);
          setAuthToken(data.token);
          setPatient(data.patient);
          triggerAudio('success');
          setToast({
            type: 'success',
            text: `✓ LINKED: Registered ${data.patient.firstName} ${data.patient.lastName} via Bot Console!`
          });
          setShowBotSandbox(false);
          fetchAppointments();
        }
      } else {
        const err = await res.json();
        setToast({ type: 'alert', text: err.error || 'Server rejected registration.' });
      }
    } catch (e) {
      console.error(e);
      setToast({ type: 'alert', text: 'Telemetry connection timed out.' });
    }
  };

  const handleDiagnosticSubmit = () => {
    triggerAudio('click');
    if (!selectedGoal) {
      setToast({ type: 'alert', text: '⚠️ Please select a treatment goal first.' });
      return;
    }

    let spec = 'Dentures Specialist';
    let docMatchId = 'doc-3'; // Default fallback Dr. Helen
    let desc = '';

    if (selectedGoal === 'straighten') {
      spec = 'Orthodontics';
      docMatchId = 'doc-2'; // Dr. Sarah (Orthodontics)
      desc = `Based on your goal, you require specialized dental correction. Orthodontic devices like clear aligners will safely align your teeth and correct bite anomalies.`;
    } else if (selectedGoal === 'pain' || painScale >= 6) {
      spec = 'Oral Surgery';
      docMatchId = 'doc-1'; // Dr. Johan Smit
      desc = `High pain index detected (${painScale}/10). We strongly recommend an urgent clinical diagnostic consult with our principal director, Dr. Johan Smit.`;
    } else if (selectedGoal === 'whitening') {
      spec = 'Cosmetic Dentistry';
      docMatchId = 'doc-1'; // Dr. Johan Smit (Cosmetic specialty)
      desc = `To enhance the dental shade index, a light-activated clinical aesthetic dental whitening and polishing is recommended.`;
    } else {
      spec = 'Oral Hygiene';
      docMatchId = 'doc-4'; // Dr. Michael (Hygiene)
      desc = `A preventive ultrasonic plaque scaling, fluoride rinse, and absolute clean is suggested to reinforce gum tissue resilience.`;
    }

    setDiagnosticResult({
      specialization: spec,
      message: desc,
      docId: docMatchId
    });
    setAssistantStep(2);
    triggerAudio('success');
  };

  const handleBookFromDiagnostics = async () => {
    if (!diagnosticResult) return;
    triggerAudio('click');
    const matchedDoc = doctors.find(d => d.id === diagnosticResult.docId) || doctors[0];
    
    try {
      const defaultTime = '11:00';
      const defaultDate = '2025-02-15';
      const res = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          doctorId: matchedDoc.id,
          date: defaultDate,
          timeSlot: defaultTime,
          treatmentType: matchedDoc.specialization,
          notes: `Secured via Diagnostics Assistant: ${dentalSymptom || 'Aesthetic Checkup'}`
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        triggerAudio('book');
        setToast({
          type: 'success',
          text: `✓ Reserved ${matchedDoc.name} for ${defaultTime} on Feb 15!`
        });
        fetchAppointments();
        setShowDentalAssistant(false);
        setAssistantStep(1);
        setSelectedGoal('');
        setDentalSymptom('');
        setDiagnosticResult(null);
      } else {
        setToast({
          type: 'alert',
          text: data.error || 'Requested slot is currently taken.'
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDoctors();
    authenticateTelegramUser();
  }, []);

  useEffect(() => {
    if (authToken) {
      fetchPatientProfile(authToken);
      fetchAppointments();
    }
  }, [authToken]);

  // Core instant scheduling
  const handleHomeQuickBook = async (timeSlot: string) => {
    triggerAudio('click');
    const doctorJohan = doctors.find(d => d.id === 'doc-1') || doctors[0];
    try {
      const res = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          doctorId: doctorJohan.id,
          date: selectedMainDate,
          timeSlot: timeSlot,
          treatmentType: doctorJohan.specialization,
          notes: "Secured via Instant Agenda Module"
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        triggerAudio('book');
        setToast({
          type: 'success',
          text: `✓ Dr. Johan smit reserved for ${timeSlot} on Feb ${selectedMainDate.split('-')[2]}!`
        });
        fetchAppointments();
      } else {
        setToast({
          type: 'alert',
          text: data.error || 'Requested slot already booked.'
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Detailed consultation sheet booking
  const handleDetailBook = async () => {
    triggerAudio('click');
    try {
      const res = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          date: detailSelectedDate,
          timeSlot: detailSelectedTime,
          treatmentType: selectedDoctor.specialization,
          notes: "Private detailed clinical appointment"
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        triggerAudio('success');
        setToast({
          type: 'clinical',
          text: `✓ SECURED: ${selectedDoctor.name} at ${detailSelectedTime} on Feb ${detailSelectedDate.split('-')[2]}`
        });
        fetchAppointments();
        setShowBookedModal(true);
      } else {
        setToast({
          type: 'alert',
          text: data.error || 'This slot is currently allocated!'
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelAppointment = async (apptId: string) => {
    triggerAudio('click');
    try {
      const res = await fetch('/api/appointments/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          appointmentId: apptId,
          status: 'cancelled'
        })
      });

      if (res.ok) {
        triggerAudio('cancel');
        setToast({
          type: 'success',
          text: '✓ Slot successfully cancelled and returned to registers.'
        });
        fetchAppointments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Calendar dates Feb 12 - Feb 18 (Image 1 replica)
  const febDates = useMemo(() => {
    const weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    return Array.from({ length: 7 }, (_, i) => {
      const dayNum = 12 + i;
      return {
        iso: `2025-02-${dayNum}`,
        dayNum,
        dayName: weekdays[i],
      };
    });
  }, []);

  // Calendar dates matching Detailed View (Photo 2): Feb 20 - 26
  const detailFebDates = useMemo(() => {
    const weekdays = ['SAT', 'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI'];
    return Array.from({ length: 7 }, (_, i) => {
      const dayNum = 20 + i;
      return {
        iso: `2025-02-${dayNum}`,
        dayNum,
        dayName: weekdays[i],
      };
    });
  }, []);

  const displayDoctors = useMemo(() => {
    return doctors.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(localSearch.toLowerCase()) || 
                            doc.specialization.toLowerCase().includes(localSearch.toLowerCase());
      
      let matchesCategory = true;
      if (selectedCategory && selectedCategory !== 'Dentures') {
        const catClean = selectedCategory.toLowerCase();
        if (catClean.includes('braces')) {
          matchesCategory = doc.specialization.toLowerCase().includes('orthodontics');
        } else if (catClean.includes('gingivitis')) {
          matchesCategory = doc.specialization.toLowerCase().includes('hygiene') || doc.specialization.toLowerCase().includes('specialist');
        } else if (catClean.includes('treatment')) {
          matchesCategory = doc.specialization.toLowerCase().includes('dentistry') || doc.specialization.toLowerCase().includes('specialist') || doc.specialization.toLowerCase().includes('hygiene');
        }
      }

      const matchesRating = doc.rating >= ratingRange;
      const matchesSpecializationFilter = selectedSpecialization === 'All' || doc.specialization === selectedSpecialization;

      return matchesSearch && matchesCategory && matchesRating && matchesSpecializationFilter;
    });
  }, [doctors, localSearch, selectedCategory, ratingRange, selectedSpecialization]);

  const toggleFavoriteList = (id: string) => {
    triggerAudio('click');
    if (likedDoctors.includes(id)) {
      setLikedDoctors(prev => prev.filter(x => x !== id));
      setToast({ type: 'success', text: 'Removed from primary bookmarks.' });
    } else {
      setLikedDoctors(prev => [...prev, id]);
      setToast({ type: 'clinical', text: '♥️ Added to priority clinical files.' });
    }
  };

  const navigateToDoctorDetails = (doc: Doctor) => {
    triggerAudio('click');
    setPrevView(currentView === 'detail' ? 'home' : currentView);
    setSelectedDoctor(doc);
    setCurrentView('detail');
  };

  const activeTicksMap: Record<string, number[]> = {
    '07:30': [1, 2, 3],
    '08:00': [4, 5, 6],
    '08:30': [7, 8, 9],
    '09:00': [10, 11, 12],
    '09:30': [13, 14, 15],
    '10:00': [16, 17]
  };

  return (
    <div className="min-h-screen w-full bg-[#EBF0F6] text-[#2B2925] font-sans flex items-center justify-center antialiased relative overflow-x-hidden p-0 md:p-6">
      
      {/* Background soft design accents on desktop for aesthetic cradling */}
      <div className="absolute inset-0 bg-[radial-gradient(#CBD5E1_1.2px,transparent_1.2px)] [background-size:24px_24px] pointer-events-none opacity-45 z-0" />
      <div className="absolute top-[5%] left-[5%] w-[450px] h-[450px] rounded-full bg-blue-150/45 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[5%] right-[5%] w-[450px] h-[450px] rounded-full bg-violet-150/45 blur-[120px] pointer-events-none z-0" />

      {/* Floating Tactical Notification Hub */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.94 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm p-4 bg-[#1E1C1A]/95 backdrop-blur-lg border border-[#2B2925]/15 text-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] text-left z-50 flex items-start gap-3.5"
          >
            <div className="p-1.5 rounded-full bg-amber-400/10 shrink-0">
              <Sparkles className="w-4.5 h-4.5 text-amber-300 animate-pulse" />
            </div>
            <div className="flex-1">
              <span className="font-mono text-[9px] uppercase text-amber-300 tracking-wider font-extrabold block mb-0.5">Maison de Dentiste</span>
              <p className="font-sans text-[12.5px] font-medium leading-relaxed opacity-95">{toast.text}</p>
            </div>
            <button 
              onClick={() => setToast(null)} 
              className="text-white/40 hover:text-white transition-colors bg-transparent border-none cursor-pointer p-1 shrink-0 mt-0.5 outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MASTER STANDALONE INTERACTIVE APP VIEW CONTAINER */}
      {/* Handcrafted fluid structure that automatically scales beautifully. Built meticulously to match the mobile screenshots layout precisely in desktop preview. */}
      <div className="w-full max-w-full md:max-w-[415px] min-h-screen md:min-h-[850px] md:max-h-[890px] bg-[#EFF2F6] overflow-y-auto overflow-x-hidden p-4 rounded-none md:rounded-[36px] shadow-[0_30px_70px_rgba(28,40,60,0.08)] border-0 md:border md:border-slate-200/50 flex flex-col relative z-20 scrollbar-none">
        
        <AnimatePresence mode="wait">
          
          {/* ========================================================== */}
          {/* VIEW: HOME DASHBOARD (Image 1 Layout)                      */}
          {/* ========================================================== */}
          {currentView === 'home' && (
            <motion.div
              key="portal-home"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="flex-1 flex flex-col pt-1 pb-4"
            >
              {/* Profile Header Block */}
              <div className="flex items-center justify-between mb-5 select-none">
                <div className="flex items-center space-x-3 text-left animate-fade-in">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#1E1C1A] to-[#3E3A36] text-[#FFFAF0] flex items-center justify-center font-black tracking-tight text-[15px] shadow-[0_4px_12px_rgba(28,26,23,0.12)] uppercase font-sans shrink-0 border border-white/10 select-none">
                    {patient ? `${patient.firstName[0] || 'A'}${patient.lastName ? patient.lastName[0] || '' : ''}`.slice(0, 2) : 'AN'}
                  </div>
                  <div>
                    <h3 className="text-[16px] font-black text-[#1C1A17] leading-none tracking-tight font-sans">
                      Hello {patient ? patient.firstName : "Antony"}
                    </h3>
                    <span className="text-[10px] text-[#A29E96] font-bold tracking-widest mt-1 block uppercase font-sans">
                      {patient?.phone ? "SECURE CLINICAL RECORD" : "GOOD MORNING"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Speaker Waves Control */}
                  <button
                    type="button"
                    onClick={() => { setSoundEnabled(!soundEnabled); triggerAudio('click'); }}
                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-[#4E81EE] hover:border-slate-300 hover:scale-105 active:scale-95 transition-all outline-none border border-slate-200 shadow-[0_2px_6px_rgba(0,0,0,0.02)] cursor-pointer"
                    title="Audio Feedback"
                  >
                    {soundEnabled ? (
                      <Volume2 className="w-4.5 h-4.5 text-[#4E81EE]" />
                    ) : (
                      <VolumeX className="w-4.5 h-4.5 text-slate-300" />
                    )}
                  </button>

                  {/* Transition Search View */}
                  <button
                    type="button"
                    onClick={() => { triggerAudio('click'); setPrevView('home'); setCurrentView('search'); }}
                    className="w-10 h-10 rounded-full bg-white text-slate-700 hover:text-[#4E81EE] hover:border-slate-300 hover:scale-105 active:scale-95 flex items-center justify-center transition-all border border-slate-200 shadow-[0_2px_6px_rgba(0,0,0,0.02)] cursor-pointer outline-none"
                    title="Search Doctors"
                  >
                    <Search className="w-4.5 h-4.5 text-slate-500" />
                  </button>
                  
                  {/* Notifications / scheduled appointment lists */}
                  <button
                    type="button"
                    onClick={() => { triggerAudio('click'); setShowBookedModal(true); }}
                    className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-405 hover:text-amber-500 hover:border-slate-350 hover:scale-105 active:scale-95 shadow-[0_2px_6px_rgba(0,0,0,0.02)] relative cursor-pointer transition-all outline-none"
                    title="Active Appointments"
                  >
                    <Bell className="w-4.5 h-4.5 text-slate-500" />
                    {appointments.some(a => a.status === 'scheduled') && (
                      <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white animate-pulse" />
                    )}
                  </button>
                </div>
              </div>

              {/* DR. JOHAN SMIT GRAND COSMETIC DENTISTRY BLUE CARD */}
              <div className="bg-gradient-to-br from-[#4E81EE] via-[#4879E6] to-[#3B6FD6] rounded-[34px] p-5 pb-4 text-white relative shadow-[0_16px_40px_rgba(78,129,238,0.22)] border border-white/10 overflow-hidden flex flex-col justify-between mb-5 min-h-[385px]">
                
                {/* Accent ambient lighting glow inside the card */}
                <div className="absolute top-0 right-0 w-[240px] h-[240px] bg-gradient-to-br from-white/25 to-transparent rounded-full blur-2xl z-0 pointer-events-none" />

                {/* Top Actions: Category title & Heart button */}
                <div className="flex justify-between items-start w-full relative z-20">
                  <div 
                    className="space-y-1 select-none text-left cursor-pointer group"
                    onClick={() => {
                      const doc = doctors.find(d => d.id === 'doc-1') || FALLBACK_DOCTORS[0];
                      navigateToDoctorDetails(doc);
                    }}
                  >
                    <h4 className="text-[24px] font-black tracking-tight text-white leading-none font-sans drop-shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
                      Dr. Johan smit
                    </h4>
                    <span className="text-[11px] text-blue-100 font-extrabold tracking-wider block uppercase font-sans opacity-90">
                      COSMETIC DENTISTRY
                    </span>
                  </div>

                  {/* Bookmark Button */}
                  <button
                    type="button"
                    onClick={() => toggleFavoriteList('doc-1')}
                    className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:text-rose-500 hover:bg-white hover:scale-105 active:scale-90 transition-all z-30 outline-none border-none cursor-pointer"
                  >
                    <Heart className={`w-4.5 h-4.5 transition-all ${likedDoctors.includes('doc-1') ? 'fill-rose-500 text-rose-500 stroke-rose-500 scale-105' : 'text-white'}`} />
                  </button>
                </div>

                {/* Clock Badge Pill: floating on the card relative coordinates */}
                <div className="mt-3 flex items-center space-x-1.5 bg-white/20 backdrop-blur-md self-start py-1 px-3.5 rounded-full z-20 border border-white/10 select-none shadow-xs">
                  <div className="w-4.5 h-4.5 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                    <Clock className="w-3 h-3 text-[#4E81EE]" />
                  </div>
                  <span className="text-[11px] font-extrabold font-mono tracking-tight text-white">10:00</span>
                </div>

                {/* Seamlessly blended Portrait Cutout placement */}
                <div className="absolute right-0 bottom-[84px] w-[184px] h-[230px] pointer-events-none select-none z-10 overflow-hidden opacity-95">
                  <img 
                    src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=350&h=450"
                    alt="Dr. Johan Smit Portrait"
                    className="w-full h-full object-cover object-top scale-[1.05]"
                    referrerPolicy="no-referrer"
                  />
                  {/* Subtle blur bottom gradient block to cut hard photo line */}
                  <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-[#4879E6] to-transparent" />
                </div>

                {/* COMPACT OVERLAP SHEET: Frosted-Glass Calendar Week drawer */}
                <div className="backdrop-blur-xl bg-white/10 rounded-[28px] p-3 text-white space-y-3 border border-white/15 mt-10 z-20 relative shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
                  
                  {/* Sub Header row */}
                  <div className="flex items-center justify-between text-xs select-none">
                    <span className="text-[9.5px] text-blue-100 font-extrabold tracking-wider uppercase font-sans">COSMETIC DENTISTRY</span>
                    
                    <div className="flex items-center space-x-1.5 opacity-90">
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          triggerAudio('click'); 
                          setToast({ type: 'clinical', text: 'Chat connection: Consulting Dr. Johan smit' }); 
                        }} 
                        className="p-1 px-1.5 rounded-lg bg-white/10 hover:bg-white/20 border-none outline-none cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-white" />
                      </button>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          const doc = doctors.find(d => d.id === 'doc-1') || FALLBACK_DOCTORS[0]; 
                          navigateToDoctorDetails(doc); 
                        }} 
                        className="p-1 px-1.5 rounded-lg bg-white/10 hover:bg-white/20 border-none outline-none cursor-pointer"
                      >
                        <MoreVertical className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Calendar Details Row */}
                  <div className="flex items-center justify-between pt-0.5 select-none text-white">
                    <span className="text-[11px] font-black tracking-wider uppercase font-sans">CALENDAR WEEK</span>
                    <span className="text-[10.5px] text-white font-mono font-bold flex items-center space-x-0.5 cursor-pointer hover:opacity-80">
                      <span>February 2025</span>
                    </span>
                  </div>

                  {/* Date Pills layout matching Image 1: Feb 12 - Feb 18 horizontal row */}
                  <div className="w-full flex justify-between gap-1 mt-1 select-none overflow-x-auto scrollbar-none">
                    {febDates.map((date) => {
                      const isSelected = selectedMainDate === date.iso;
                      
                      if (isSelected) {
                        return (
                          <div
                            key={date.iso}
                            className="bg-white text-[#4E81EE] rounded-[20px] p-1.5 py-3 flex flex-col items-center justify-center outline-none border-none shadow-md font-sans min-w-[40px] transform duration-150"
                          >
                            <span className="text-[8.5px] font-black uppercase text-[#4E81EE]/90 mb-1">
                              {date.dayName}
                            </span>
                            <div className="w-6.5 h-6.5 rounded-full bg-[#4E81EE] text-white flex items-center justify-center text-[11px] font-black font-mono shadow-sm">
                              {date.dayNum}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <button
                          type="button"
                          key={date.iso}
                          onClick={() => {
                            setSelectedMainDate(date.iso);
                            triggerAudio('click');
                          }}
                          className="flex-1 min-w-[36px] p-1.5 py-2.5 flex flex-col items-center justify-center transition-all cursor-pointer border-none bg-transparent hover:bg-white/10 rounded-[18px] text-white"
                        >
                          <span className="text-[8.5px] font-extrabold text-[#99BEFF]/85 uppercase tracking-wider">
                            {date.dayName}
                          </span>
                          <span className="text-[11.5px] font-black font-mono mt-1 text-white">
                            {date.dayNum}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* DR. JOHAN SMIT VACANCIES SELECTION CARD */}
              <div className="bg-white rounded-[28px] p-4.5 border border-slate-200/50 shadow-[0_4px_12px_rgba(0,0,0,0.015)] text-left mb-5">
                <span className="text-[9.5px] font-mono text-[#A29E96] uppercase tracking-wider font-extrabold block mb-3 pl-0.5 select-none">
                  DR. JOHAN SMIT VACANCIES (FEB {selectedMainDate.split('-')[2]})
                </span>
                
                <div className="grid grid-cols-4 gap-2">
                  {['09:00', '09:30', '10:00', '10:30'].map((timeStr) => {
                    const isBooked = appointments.some(a => a.date === selectedMainDate && a.timeSlot === timeStr && a.status === 'scheduled');

                    return (
                      <button
                        type="button"
                        key={timeStr}
                        onClick={() => handleHomeQuickBook(timeStr)}
                        className={`py-2 px-1 rounded-2xl text-[12px] font-black font-mono text-center border transition-all duration-150 ${
                          isBooked
                            ? 'bg-rose-50 text-rose-500 border-rose-100/60 line-through cursor-not-allowed opacity-75'
                            : 'bg-[#F9FAFB] text-[#2B2925] border-slate-100 hover:bg-[#4E81EE] hover:text-white hover:border-[#4E81EE] hover:scale-102 active:scale-95 cursor-pointer'
                        }`}
                      >
                        {timeStr}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AVAILABLE CLINIC SPECIALISTS SECTION */}
              <div className="space-y-4">
                <div className="flex items-center justify-between select-none px-1">
                  <h4 className="text-[17px] font-black text-[#1C1A17] font-sans tracking-tight">
                    Available Doctor
                  </h4>
                  <button 
                    type="button" 
                    onClick={() => { triggerAudio('click'); setCurrentView('search'); }}
                    className="text-xs text-[#4E81EE] hover:underline font-extrabold border-none bg-transparent cursor-pointer outline-none"
                  >
                    See All
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Render Available Specialist cards matching UI flow */}
                  {displayDoctors.filter(d => d.id !== 'doc-1').slice(0, 3).map((doc) => {
                    const isFavorite = likedDoctors.includes(doc.id);
                    return (
                      <div 
                        key={doc.id}
                        onClick={() => navigateToDoctorDetails(doc)}
                        className="bg-white rounded-[26px] p-3 border border-slate-200/50 shadow-[0_4px_12px_rgba(0,0,0,0.01)] flex items-center justify-between hover:border-blue-300 transition-all cursor-pointer group hover:shadow-md duration-150"
                      >
                        <div className="flex items-center space-x-3.5 text-left">
                          <div className="w-[49px] h-[49px] rounded-2xl bg-gradient-to-tr from-indigo-50 to-[#E6E0FF] text-[#715CFF] flex items-center justify-center font-black shrink-0 border border-indigo-100/50 relative shadow-xs text-xs font-sans select-none">
                            {doc.name.replace('Dr. ', '').split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase()}
                            {/* Live Active pulse green dot */}
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
                          </div>
                          
                          <div>
                            <h5 className="text-[13.5px] font-black text-slate-900 leading-tight group-hover:text-[#4E81EE] transition-colors">
                              {doc.name}
                            </h5>
                            <span className="text-[9px] text-[#A29E96] font-bold uppercase tracking-wider mt-1 block">
                              🦷 {doc.specialization}
                            </span>
                          </div>
                        </div>

                        {/* Card Bookmark */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleFavoriteList(doc.id); }} 
                          className="text-slate-300 hover:text-rose-500 transition-colors shrink-0 p-2 bg-transparent border-none cursor-pointer outline-none"
                        >
                          <Heart className={`w-4.5 h-4.5 transition-all ${isFavorite ? 'fill-rose-500 text-rose-500 stroke-rose-500 scale-105' : 'text-slate-300 hover:scale-105'}`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================== */}
          {/* VIEW: FIND SPECIALISTS & SEARCH SCREEN                     */}
          {/* ========================================================== */}
          {currentView === 'search' && (
            <motion.div
              key="portal-search"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="flex-1 flex flex-col pt-1 pb-4 text-[#2B2925]"
            >
              {/* Back navigation */}
              <div className="flex items-center justify-between mb-5 select-none">
                <button
                  onClick={() => { triggerAudio('click'); setCurrentView('home'); }}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-xs cursor-pointer active:scale-95 transition-transform"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-700" />
                </button>
                <h3 className="text-[13px] font-black text-[#1C1A17] tracking-wider uppercase font-sans">Find Specialists</h3>
                <button
                  type="button"
                  onClick={() => { setSoundEnabled(!soundEnabled); triggerAudio('click'); }}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-blue-500 border border-slate-200 cursor-pointer active:scale-95"
                >
                  {soundEnabled ? <Volume2 className="w-4.5 h-4.5 text-blue-500" /> : <VolumeX className="w-4.5 h-4.5 text-slate-300" />}
                </button>
              </div>

              {/* Dynamic search bar */}
              <div className="flex items-center space-x-2.5 mb-5">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search className="w-4.5 h-4.5" />
                  </span>
                  <input 
                    type="text"
                    placeholder="Search specialists..."
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    className="w-full bg-white border border-slate-200/60 rounded-[20px] py-3.5 pl-11 pr-10 text-[13px] font-bold text-slate-800 placeholder-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-105"
                  />
                  {localSearch && (
                    <button 
                      onClick={() => setLocalSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 text-[9px] hover:bg-slate-200 border-none cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
                
                {/* Advanced filter triggers button */}
                <button 
                  onClick={() => {
                    triggerAudio('click');
                    setShowFiltersDrawer(true);
                  }}
                  className={`w-11 h-11 rounded-[18px] flex items-center justify-center transition-all cursor-pointer border shadow-xs ${
                    showFiltersDrawer || ratingRange > 4.5 || selectedSpecialization !== 'All'
                      ? 'bg-[#4E81EE] text-white border-[#4E81EE]' 
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                  title="Advanced search criteria options"
                >
                  <Sliders className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Category selector row */}
              <div className="w-full flex items-center space-x-3.5 overflow-x-auto pb-4 scrollbar-none mb-5 select-none shrink-0 border-b border-slate-200/30">
                {[
                  { name: 'Braces', icon: '🦷' },
                  { name: 'Gingivitis', icon: '🩺' },
                  { name: 'Gingivitis-2', displayName: 'Gingivitis', icon: '👄' },
                  { name: 'Treatment', icon: '💊' },
                  { name: 'Dentures', icon: '⭐' }
                ].map((category, index) => {
                  const label = category.displayName || category.name;
                  const isSelected = selectedCategory === category.name;
                  return (
                    <button
                      type="button"
                      key={index}
                      onClick={() => {
                        setSelectedCategory(category.name);
                        triggerAudio('click');
                      }}
                      className="flex flex-col items-center shrink-0 focus:outline-none border-none bg-transparent cursor-pointer"
                    >
                      <div className={`w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all shadow-sm ${
                        isSelected 
                          ? 'bg-[#4E81EE] text-white scale-105 shadow-md shadow-blue-500/15' 
                          : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200/50'
                      }`}>
                        <span className="text-lg leading-none">{category.icon}</span>
                      </div>
                      <span className={`text-[9px] font-black mt-2 tracking-wide font-sans uppercase ${isSelected ? 'text-[#4E81EE]' : 'text-[#A29E96]'}`}>{label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Doctors listing */}
              <div className="flex items-center justify-between mb-4 select-none px-1">
                <h4 className="text-[16px] font-black text-[#1C1A17] tracking-tight font-sans">Top Doctors</h4>
                <button 
                  onClick={() => { triggerAudio('click'); setLocalSearch(''); setSelectedCategory('Braces'); setRatingRange(4.5); setSelectedSpecialization('All'); }}
                  className="text-xs text-slate-400 hover:text-[#4E81EE] font-extrabold bg-transparent border-none cursor-pointer"
                >
                  Reset Views
                </button>
              </div>

              {/* Responsive Columns matches mockup layout grid */}
              <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[430px] pb-6 pr-0.5 scrollbar-none">
                {displayDoctors.length === 0 ? (
                  <div className="col-span-2 py-10 text-center space-y-2">
                    <p className="text-sm font-bold text-[#726E68]">No clinic specialists match filters.</p>
                    <p className="text-xs text-slate-400">Try adjusting your search query!</p>
                  </div>
                ) : (
                  displayDoctors.map((doctor) => {
                    const isOnline = doctor.rating >= 4.8;
                    return (
                      <div 
                        key={doctor.id}
                        onClick={() => navigateToDoctorDetails(doctor)}
                        className="bg-white rounded-[28px] p-3 shadow-xs border border-slate-200/40 hover:border-blue-300 transition-all duration-150 flex flex-col items-center cursor-pointer text-center relative"
                      >
                        <div className="relative w-14 h-14 mb-2.5 shadow-xs rounded-2xl bg-gradient-to-tr from-indigo-50 to-[#E6E0FF] text-[#715CFF] flex items-center justify-center font-black text-sm border border-indigo-100/50 shrink-0 select-none">
                          {doctor.name.replace('Dr. ', '').split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase()}
                          <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white z-20 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                        </div>

                        <h5 className="text-[12.5px] font-black text-slate-900 leading-tight mb-0.5 max-w-[130px] truncate">
                          {doctor.name}
                        </h5>
                        <span className="text-[9px] text-[#A29E96] font-bold uppercase tracking-wide mb-3 block truncate max-w-[120px]">
                          {doctor.specialization}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateToDoctorDetails(doctor);
                          }}
                          className="w-full py-2 bg-[#4E81EE] hover:bg-blue-600 text-white rounded-[16px] text-[11px] font-extrabold tracking-wide transition-all border-none cursor-pointer active:scale-95 shadow-xs"
                        >
                          Appointment
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}

          {/* ========================================================== */}
          {/* VIEW: PHYSICIAN DETAIL DASHBOARD (Photo 2)                  */}
          {/* ========================================================== */}
          {currentView === 'detail' && (
            <motion.div
              key="portal-detail"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="flex-1 flex flex-col bg-white text-slate-800 p-0 rounded-[32px] overflow-hidden"
            >
              <div className="relative w-full h-[285px] shrink-0 overflow-hidden bg-gradient-to-br from-[#1E1B4B] via-[#0F172A] to-[#1E293B] select-none text-white">
                
                {/* Advanced decorative cyber grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:14px_14px]" />
                
                {/* Holographic glowing orb inside doctor profile banner */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full bg-gradient-to-tr from-[#715CFF]/20 to-indigo-500/10 blur-[50px] pointer-events-none" />

                {/* Massive Watermark representing specialization */}
                <div className="absolute -right-6 -bottom-6 text-[68px] font-black tracking-tighter text-white/[0.03] select-none font-mono uppercase leading-none">
                  {selectedDoctor.specialization.split(' ')[0]}
                </div>

                {/* Arrow actions */}
                <div className="absolute top-4 inset-x-4 flex items-center justify-between z-20 mt-1">
                  <button
                    onClick={() => { triggerAudio('click'); setCurrentView(prevView); }}
                    className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/25 outline-none transition-transform active:scale-90 cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  
                  <button
                    onClick={() => toggleFavoriteList(selectedDoctor.id)}
                    className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-rose-450 hover:scale-105 active:scale-95 outline-none transition-transform cursor-pointer"
                  >
                    <Heart className={`w-4.5 h-4.5 ${likedDoctors.includes(selectedDoctor.id) ? 'fill-rose-500 text-rose-500 stroke-rose-500' : 'text-slate-300'}`} />
                  </button>
                </div>

                {/* Profile card details styled beautifully with monogram initials */}
                <div className="absolute bottom-11 left-5 z-20 flex flex-col items-start space-y-3.5">
                  <div className="flex gap-3.5 items-center text-left">
                    {/* Glowing dynamic initials circle */}
                    <div className="w-[62px] h-[62px] rounded-[22px] bg-gradient-to-tr from-[#715CFF] to-[#A297FF] flex items-center justify-center font-black text-[22px] text-white tracking-tight shadow-[0_8px_24px_rgba(113,92,255,0.4)] border border-white/15 shrink-0 select-none">
                      {selectedDoctor.name.replace('Dr. ', '').split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase()}
                    </div>

                    <div className="text-left space-y-1">
                      <div className="flex items-center space-x-1.5 bg-amber-400/15 text-amber-300 font-extrabold text-[9.5px] py-1 px-2.5 rounded-lg border border-amber-400/25 self-start">
                        <Star className="w-3 h-3 fill-amber-300 stroke-none animate-pulse" />
                        <span>{selectedDoctor.rating} CERTIFIED</span>
                      </div>

                      <h2 className="text-[21px] font-black tracking-tight text-white leading-none font-sans drop-shadow-md">
                        {selectedDoctor.name}
                      </h2>
                    </div>
                  </div>
                  
                  <span className="text-[9.5px] text-[#A297FF] font-black tracking-widest uppercase font-mono bg-white/[0.04] py-1 px-3 rounded-full border border-white/[0.06] block">
                    ⚕️ {selectedDoctor.specialization.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Sliding Bottom details sheet layout matching Photo 2 indices */}
              <div className="px-4 pb-6 pt-2 space-y-5 bg-white flex-1 overflow-y-auto rounded-t-[32px] mt-[-22px] relative z-20 shadow-[0_-12px_30px_rgba(0,0,0,0.03)] scrollbar-none">
                
                {/* Tactile indicator handle */}
                <div className="w-11 h-1 bg-slate-200 rounded-full mx-auto my-1 select-none pointer-events-none" />

                <div className="flex items-center justify-between pt-1">
                  <span 
                    className="py-2.5 px-5.5 rounded-full bg-[#715CFF] text-white font-black text-[11.5px] shadow-sm select-none tracking-wide"
                  >
                    Details
                  </span>

                  <div className="flex items-center space-x-3">
                    {/* Communication shortcuts triggers simulated actions */}
                    <button 
                      onClick={() => { triggerAudio('success'); setToast({ type: 'clinical', text: `Consultation: Dialing Dr. ${selectedDoctor.name}` }); }}
                      className="w-10 h-10 rounded-full bg-white hover:bg-slate-50 flex items-center justify-center border border-slate-200 cursor-pointer shadow-xs transition-all active:scale-90 hover:scale-105"
                      title="Audio Call Clinic"
                    >
                      <PhoneCall className="w-4.5 h-4.5 text-slate-700" />
                    </button>
                    <button 
                      onClick={() => { triggerAudio('click'); setToast({ type: 'clinical', text: `Gateway setup: Live telehealth workspace with ${selectedDoctor.name}` }); }}
                      className="w-10 h-10 rounded-full bg-white hover:bg-slate-50 flex items-center justify-center border border-slate-200 cursor-pointer shadow-xs transition-all active:scale-90 hover:scale-105"
                      title="Video Conference Panel"
                    >
                      <Video className="w-4.5 h-4.5 text-slate-700" />
                    </button>
                    <button 
                      onClick={() => { triggerAudio('click'); setToast({ type: 'clinical', text: `Direct session established with ${selectedDoctor.name}.` }); }}
                      className="w-10 h-10 rounded-full bg-white hover:bg-slate-50 flex items-center justify-center border border-slate-200 cursor-pointer shadow-xs transition-all active:scale-90 hover:scale-105"
                      title="Clinical Messaging"
                    >
                      <MessageSquare className="w-4.5 h-4.5 text-slate-700" />
                    </button>
                  </div>
                </div>

                {/* Professional clinical horizontal records row: Experience Years, Patients count, Reviews count */}
                <div className="grid grid-cols-3 gap-1 bg-slate-50/60 border border-slate-100/80 rounded-2xl p-3.5 select-none text-center shadow-xs">
                  <div className="space-y-1">
                    <span className="text-[9.5px] text-slate-400 font-extrabold block tracking-wider uppercase">Experience</span>
                    <p className="text-[14px] font-black text-[#715CFF] leading-none">{selectedDoctor.experienceYears} Years</p>
                  </div>
                  <div className="space-y-1 border-x border-slate-150">
                    <span className="text-[9.5px] text-slate-400 font-extrabold block tracking-wider uppercase">Patients</span>
                    <p className="text-[14px] font-black text-[#715CFF] leading-none">4.5k+</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9.5px] text-slate-400 font-extrabold block tracking-wider uppercase">Reviews</span>
                    <p className="text-[14px] font-black text-[#715CFF] leading-none">{selectedDoctor.reviewsCount}+</p>
                  </div>
                </div>

                {/* Compact Elegant About section */}
                <div className="text-left space-y-2 select-none pt-1">
                  <span className="text-[11px] font-black text-slate-800 tracking-wider block uppercase font-mono">About Doctor</span>
                  <p className="text-[12px] text-slate-500 leading-relaxed font-sans font-medium">
                    {selectedDoctor.id === 'doc-2' ? (
                      "Dr. Riya Dasli is a leading orthodontics specialist certified by Swiss Orthodontic Councils, dedicating 12+ years to micro-engineered aesthetic invisible braces and comfortable bite corrections."
                    ) : selectedDoctor.id === 'doc-1' ? (
                      "Dr. Johan Smit is an internationally recognized leader in cosmetic dentistry, specializing in high-definition porcelain composite restorations and minimally invasive smile enhancements."
                    ) : (
                      "Expert clinical resident specializing in preventative dental science, focused on painless ultrasonic biofilm scaling and advanced structural tooth enamel remineralization."
                    )}
                  </p>
                </div>

                {/* Date select wrapper */}
                <div className="space-y-3 select-none pt-1 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-800 tracking-wider uppercase font-mono">Select Date</span>
                    <div className="flex items-center space-x-1 text-[10px] font-bold text-slate-400 font-mono">
                      <span>February 2025</span>
                    </div>
                  </div>

                  {/* Horizontal Scroll Date row matching photo 2: 20 -> 26 */}
                  <div className="flex justify-between gap-1 overflow-x-auto pb-1 scrollbar-none">
                    {detailFebDates.map((date) => {
                      const isSelected = detailSelectedDate === date.iso;
                      return (
                        <button
                          type="button"
                          key={date.iso}
                          onClick={() => {
                            setDetailSelectedDate(date.iso);
                            triggerAudio('click');
                          }}
                          className={`min-w-[46px] py-2.5 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer border ${
                            isSelected 
                              ? 'bg-[#715CFF] border-[#715CFF] text-white shadow-[0_6px_16px_rgba(113,92,255,0.25)] scale-102 font-bold' 
                              : 'bg-[#FAF9FF] border-slate-100 hover:border-slate-200 hover:bg-slate-50/80 text-slate-750'
                          }`}
                        >
                          <span className={`text-[13px] font-black font-mono leading-none ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                            {date.dayNum}
                          </span>
                          <span className={`text-[7.5px] font-black tracking-tight mt-1 uppercase ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                            {date.dayName}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Gauge Indicator timeline dial clock tick slider matching Photo 2 layout */}
                <div className="space-y-3.5 select-none pt-1 text-left">
                  <span className="text-[11px] font-black text-slate-800 tracking-wider uppercase font-mono">Select Time</span>
                  
                  <div className="relative">
                    <div className="w-full h-[64px] bg-[#FAF9FF] border border-slate-100 rounded-2xl p-2.5 relative flex flex-col justify-end overflow-hidden shadow-xs">
                      
                      {/* Chronic Dial vertical tickers */}
                      <div className="flex justify-between items-end h-[24px] px-3.5 cursor-pointer">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((tickIdx) => {
                          const activeIndices = activeTicksMap[detailSelectedTime] || [4, 5, 6];
                          const isActive = activeIndices.includes(tickIdx);
                          return (
                            <span 
                              key={tickIdx} 
                              className={`w-[2.5px] rounded-full transition-all duration-300 ${
                                isActive 
                                  ? 'bg-[#715CFF] h-[22px] shadow-[0_0_6px_rgba(113,92,255,0.5)]' 
                                  : 'bg-slate-200 h-[10px]'
                              }`} 
                            />
                          );
                        })}
                      </div>

                      {/* Timeline scales */}
                      <div className="flex justify-around text-[8.5px] font-bold font-mono text-slate-400 mt-2 select-none pointer-events-none">
                        <span>7:30</span>
                        <span>8:00</span>
                        <span>8:30</span>
                        <span>9:00</span>
                      </div>

                      <motion.div 
                        layout
                        className="absolute top-1 h-0.5 bg-[#715CFF] rounded-full shadow-xs shadow-[#715CFF]/30"
                        style={{
                          left: detailSelectedTime === '07:30' ? '12%' :
                                detailSelectedTime === '08:00' ? '28%' :
                                detailSelectedTime === '08:30' ? '45%' :
                                detailSelectedTime === '09:00' ? '62%' :
                                detailSelectedTime === '09:30' ? '78%' : '88%',
                          width: '20%'
                        }}
                      />
                    </div>
                  </div>

                  {/* Time lists selection pills */}
                  <div className="flex justify-between gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                    {['07:30', '08:00', '08:30', '09:00', '09:30', '10:00'].map((timeStr) => {
                      const isTimeSelected = detailSelectedTime === timeStr;
                      return (
                        <button
                          type="button"
                          key={timeStr}
                          onClick={() => {
                            setDetailSelectedTime(timeStr);
                            triggerAudio('click');
                          }}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-black font-mono border transition-all cursor-pointer ${
                            isTimeSelected 
                              ? 'bg-[#715CFF]/10 text-[#715CFF] border-[#715CFF]/40 font-bold scale-102 shadow-xs' 
                              : 'bg-[#FAF9FF] text-slate-700 border-slate-100 hover:border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {timeStr}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Primary Booking CTA button */}
                <button
                  type="button"
                  onClick={handleDetailBook}
                  className="w-full py-4 bg-gradient-to-r from-[#8E86FA] to-[#715CFF] hover:from-[#7E74F8] hover:to-[#5942E6] text-white rounded-[24px] font-black tracking-wider text-xs uppercase transition-all shadow-[0_8px_26px_rgba(113,92,255,0.28)] flex items-center justify-center space-x-1.5 border-none cursor-pointer mt-5 active:scale-[0.98]"
                >
                  <span>Book Session</span>
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </div>

      {/* ========================================================== */}
      {/* MONOLITHIC BOOKED CONSULTATIONS LIST OVERLAY MODAL          */}
      {/* ========================================================== */}
      <AnimatePresence>
        {showBookedModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none"
            onClick={() => setShowBookedModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-[28px] w-full max-w-sm p-5 space-y-4 shadow-2xl relative border border-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b pb-2.5 border-slate-100">
                <div>
                  <span className="font-mono text-[8.5px] uppercase tracking-wider text-[#4E81EE] font-extrabold block">Official Swiss Patient Desk</span>
                  <h4 className="text-[14px] font-black text-slate-900 leading-none mt-0.5">Your Medical Agenda</h4>
                </div>
                <button 
                  onClick={() => { triggerAudio('click'); setShowBookedModal(false); }}
                  className="w-8 h-8 bg-slate-50 hover:bg-slate-150 border border-slate-200/50 text-slate-500 flex items-center justify-center rounded-full transition-colors cursor-pointer outline-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {appointments.filter(a => a.status === 'scheduled').length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <div className="text-3xl leading-none">📅</div>
                  <p className="text-sm font-bold text-slate-550 font-sans">No recorded clinical medical appointments.</p>
                  <p className="text-[10px] text-slate-400">Secure open time slots directly on doctor files.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                  {appointments.filter(a => a.status === 'scheduled').map((app) => {
                    const doc = doctors.find(d => d.id === app.doctorId) || FALLBACK_DOCTORS[0];
                    return (
                      <div key={app.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/40 flex items-center justify-between text-left">
                        <div className="flex items-center space-x-2.5">
                          <img 
                            src={doc.avatar} 
                            alt={doc.name} 
                            className="w-9.5 h-9.5 object-cover rounded-full shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="text-[9px] font-mono text-[#4E81EE] font-bold tracking-tight block">{app.date} • {app.timeSlot}</span>
                            <h5 className="text-[12px] font-black text-slate-900 leading-none my-0.5">{doc.name}</h5>
                            <span className="text-[9px] text-slate-400 block">{doc.specialization}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCancelAppointment(app.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 hover:text-rose-650 rounded-xl transition-all border-none bg-transparent cursor-pointer outline-none"
                          title="Instant Release Slot"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                onClick={() => { triggerAudio('click'); setShowBookedModal(false); }}
                className="w-full py-3 bg-gradient-to-r from-[#8E86FA] to-[#715CFF] hover:from-[#7E74F8] text-white rounded-xl text-xs font-extrabold transition-all shadow-sm flex items-center justify-center border-none cursor-pointer outline-none"
              >
                <span>Continue</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================== */}
      {/* INTERACTIVE FILTERS DRAWER (ADVANCED SEARCH CONTROLS)     */}
      {/* ========================================================== */}
      <AnimatePresence>
        {showFiltersDrawer && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-end justify-center">
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={() => setShowFiltersDrawer(false)} />
            
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="bg-white rounded-t-[36px] w-full max-w-[415px] p-6 space-y-6 shadow-2xl border-t border-slate-100/60 relative z-10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-blue-500 uppercase tracking-wider block">Specialists Search filters</span>
                  <h4 className="text-lg font-black text-slate-900 font-sans tracking-tight">Fine-tune Search Criteria</h4>
                </div>
                <button 
                  onClick={() => { triggerAudio('click'); setShowFiltersDrawer(false); }}
                  className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors border-none cursor-pointer outline-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Specialization selection */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wide block text-left">Specialty Room</label>
                <div className="grid grid-cols-2 gap-2">
                  {['All', 'Cosmetic dentistry', 'Oral hygiene', 'Dental Orthodontics'].map((spec) => {
                    const isSelected = selectedSpecialization === spec;
                    return (
                      <button
                        type="button"
                        key={spec}
                        onClick={() => { triggerAudio('click'); setSelectedSpecialization(spec); }}
                        className={`py-2 px-3 rounded-xl text-xs font-bold text-left border transition-all ${
                          isSelected 
                            ? 'bg-[#4E81EE]/10 text-[#4E81EE] border-[#4E81EE]' 
                            : 'bg-[#F9FAFB] text-slate-600 border-slate-205 hover:bg-slate-100'
                        }`}
                      >
                        {spec}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slider for rating */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wide block">Minimum Rating</label>
                  <span className="text-xs font-extrabold text-[#4E81EE] font-mono">⭐️ {ratingRange.toFixed(1)}+</span>
                </div>
                <input 
                  type="range"
                  min="4.5"
                  max="4.9"
                  step="0.1"
                  value={ratingRange}
                  onChange={(e) => { triggerAudio('click'); setRatingRange(parseFloat(e.target.value)); }}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#4E81EE]"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>⭐️ 4.5</span>
                  <span>⭐️ 4.7</span>
                  <span>⭐️ 4.9</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerAudio('click');
                    setSelectedSpecialization('All');
                    setRatingRange(4.5);
                    setToast({ type: 'success', text: 'Specialist filters cleared.' });
                  }}
                  className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl text-xs font-extrabold transition-all border border-slate-200 cursor-pointer"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerAudio('success');
                    setShowFiltersDrawer(false);
                    setToast({ type: 'clinical', text: `Search filtered: ${displayDoctors.length} matched.` });
                  }}
                  className="flex-1 py-3 bg-[#4E81EE] hover:bg-blue-600 text-white rounded-2xl text-xs font-extrabold transition-all shadow-md shadow-blue-500/10 border-none cursor-pointer"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
