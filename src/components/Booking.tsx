import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Sparkles, AlertCircle, CheckCircle2, User, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  department: string;
  avatar: string;
  workingHours: { start: string; end: string };
  breakTime: { start: string; end: string };
}

interface Slot {
  time: string;
  available: boolean;
  isBreak: boolean;
}

interface BookingProps {
  doctor: Doctor;
  authToken: string;
  onSuccess: (newAppointment: any) => void;
  onCancel: () => void;
}

const TREATMENTS = [
  "General Consultation & Diagnosis",
  "Aesthetic Teeth Whitening",
  "Orthodontic Adjustment (Braces)",
  "Root Canal Therapy",
  "Dental Implant Consultation",
  "Deep Scale & Fluoride Cleaning"
];

export default function Booking({ doctor, authToken, onSuccess, onCancel }: BookingProps) {
  // Calendar scheduling begins from tomorrow to give private dentists heads up, or customizable
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [treatmentType, setTreatmentType] = useState<string>(TREATMENTS[0]);
  const [notes, setNotes] = useState<string>('');
  
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successApp, setSuccessApp] = useState<any>(null);

  // Pre-calculate next 6 days as elegant quick pill tabs so it feels like a native Telegram iOS / Android interface.
  const quickDates = React.useMemo(() => {
    const list = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      list.push({
        iso,
        dayNum: d.getDate(),
        dayName: weekdays[d.getDay()],
        monthName: months[d.getMonth()]
      });
    }
    return list;
  }, []);

  // Fetch available slots from express backend whenever date or doctor moves
  useEffect(() => {
    if (!doctor.id || !selectedDate) return;

    let isMounted = true;
    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      setErrorMsg('');
      try {
        const response = await fetch(`/api/slots?doctorId=${doctor.id}&date=${selectedDate}`);
        const data = await response.json();
        
        if (isMounted) {
          if (data.success) {
            setSlots(data.slots || []);
            // Reset selected slot if not valid anymore
            setSelectedSlot('');
          } else {
            setErrorMsg(data.error || 'Unable to retrieve available slots.');
          }
        }
      } catch (err) {
        if (isMounted) {
          setErrorMsg('Network error. Failed to load clinic slots.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingSlots(false);
        }
      }
    };

    fetchSlots();
    return () => {
      isMounted = false;
    };
  }, [doctor.id, selectedDate]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setErrorMsg('Please select a preferred treatment hour slot.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          doctorId: doctor.id,
          date: selectedDate,
          timeSlot: selectedSlot,
          treatmentType,
          notes
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessApp(data.appointment);
        setTimeout(() => {
          onSuccess(data.appointment);
        }, 3000);
      } else {
        setErrorMsg(data.error || 'Server rejected booking details.');
      }
    } catch (err) {
      setErrorMsg('Network error. Failed to book treatment session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="booking-panel" className="bg-white rounded-2xl p-6 border border-[#EBE8E0] shadow-sm max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {!successApp ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header: Editorial Title */}
            <div className="flex items-start justify-between border-b border-[#FAF9F6] pb-4 mb-4">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-lavender-700 font-semibold bg-lavender-50 px-2 py-0.5 rounded">
                  Clinic Consultation
                </span>
                <h3 className="font-serif text-xl font-semibold text-[#2B2925] mt-1.5">Schedule Treatment</h3>
              </div>
              <button 
                onClick={onCancel}
                className="text-xs text-[#5E5B55] hover:text-[#2B2925] underline underline-offset-4 decoration-[#EBE8E0]"
              >
                Go Back
              </button>
            </div>

            {/* Doctor Profile Banner */}
            <div className="flex items-center space-x-3.5 bg-[#FAF9F6] p-3 rounded-xl border border-[#EBE8E0]/70 mb-5">
              <img 
                src={doctor.avatar} 
                alt={doctor.name} 
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-full object-cover border border-[#EBE8E0]" 
              />
              <div>
                <h4 className="font-serif text-sm font-semibold text-[#2B2925]">{doctor.name}</h4>
                <p className="text-xs text-[#5E5B55]">{doctor.specialization}</p>
                <div className="flex items-center space-x-1 mt-0.5 text-[10px] text-lavender-600 font-mono">
                  <Clock className="w-3 h-3" />
                  <span>Hours: {doctor.workingHours.start} - {doctor.workingHours.end}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              {/* Date Selection Title */}
              <div>
                <label className="text-[11px] uppercase font-mono tracking-wider text-[#9E9B95] block mb-2">
                  1. Choose Date
                </label>
                
                {/* Horizontal quick calendar picker */}
                <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-none">
                  {quickDates.map((item) => {
                    const isSelected = selectedDate === item.iso;
                    return (
                      <button
                        type="button"
                        key={item.iso}
                        onClick={() => setSelectedDate(item.iso)}
                        className={`flex-shrink-0 w-14 h-16 rounded-lg flex flex-col justify-center items-center transition-all border text-center ${
                          isSelected 
                            ? 'bg-lavender-100 border-lavender-300 text-[#493E7D]' 
                            : 'bg-white border-[#EBE8E0] hover:bg-[#FAF9F6] text-[#5E5B55]'
                        }`}
                      >
                        <span className="text-[9px] uppercase tracking-wide font-mono">{item.dayName}</span>
                        <span className="text-base font-serif font-semibold leading-tight my-0.5">{item.dayNum}</span>
                        <span className="text-[8px] tracking-wide text-[#9E9B95]">{item.monthName}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Optional custom calendar picker */}
                <div className="mt-2 flex items-center bg-white border border-[#EBE8E0] rounded-lg px-3 py-1.5 focus-within:ring-1 focus-within:ring-lavender-300">
                  <Calendar className="w-4 h-4 text-[#9E9B95] mr-2" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      if (e.target.value) setSelectedDate(e.target.value);
                    }}
                    min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                    className="w-full text-xs text-[#2B2925] bg-transparent outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Time Slot Picker */}
              <div>
                <label className="text-[11px] uppercase font-mono tracking-wider text-[#9E9B95] block mb-2">
                  2. Preferred Treatment Hour
                </label>

                {isLoadingSlots ? (
                  <div className="py-8 bg-[#FAF9F6] rounded-xl border border-dashed border-[#EBE8E0] flex flex-col items-center justify-center space-y-2">
                    <RefreshCw className="h-5 w-5 text-lavender-600 animate-spin" />
                    <span className="text-xs text-[#5E5B55]">Loading schedule slots...</span>
                  </div>
                ) : slots.length === 0 ? (
                  <div className="py-4 text-center text-xs text-[#9E9B95] bg-[#FAF9F6] rounded-lg border border-[#EBE8E0]">
                    No schedules defined for selected day.
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-1.5">
                    {slots.map((slot) => {
                      const isSelected = selectedSlot === slot.time;
                      return (
                        <button
                          type="button"
                          key={slot.time}
                          disabled={!slot.available}
                          onClick={() => {
                            setSelectedSlot(slot.time);
                            setErrorMsg('');
                          }}
                          className={`py-2 rounded-lg text-xs font-mono border text-center transition-all ${
                            !slot.available 
                              ? slot.isBreak 
                                ? 'bg-[#FAF9F6] border-transparent text-[#D0CFCB] line-through cursor-not-allowed'
                                : 'bg-[#FAF9F6] border-transparent text-[#D0CFCB] cursor-not-allowed relative overflow-hidden'
                              : isSelected
                                ? 'bg-lavender-600 border-transparent text-white ring-2 ring-lavender-100 font-medium'
                                : 'bg-white border-[#EBE8E0] hover:bg-lavender-50 hover:border-lavender-200 text-[#5E5B55] hover:text-[#493E7D]'
                          }`}
                          title={!slot.available ? (slot.isBreak ? "LunchRecess Break" : "Booked slot") : "Available slot"}
                        >
                          {slot.time}
                          {!slot.available && !slot.isBreak && (
                            <span className="absolute bottom-0 right-0 w-2 h-2 bg-red-400 rounded-tl-sm" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                
                {/* Legende of Indicators */}
                <div className="flex items-center space-x-4 mt-2.5 text-[10px] text-[#9E9B95] px-1 font-mono">
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded bg-white border border-[#EBE8E0]" />
                    <span>Free</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded bg-[#FAF9F6] border border-transparent relative overflow-hidden">
                      <span className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-red-400 rounded-tl-sm" />
                    </span>
                    <span>Booked</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded bg-[#FAF9F6] line-through text-[#D0CFCB]" />
                    <span>Break</span>
                  </div>
                </div>
              </div>

              {/* Treatment Selection */}
              <div>
                <label className="text-[11px] uppercase font-mono tracking-wider text-[#9E9B95] block mb-1.5">
                  3. Treatment / Specialty Care Needs
                </label>
                <select
                  value={treatmentType}
                  onChange={(e) => setTreatmentType(e.target.value)}
                  className="w-full text-xs text-[#2B2925] bg-white border border-[#EBE8E0] rounded-lg px-3 py-2.5 outline-none focus:ring-1 focus:ring-lavender-300"
                >
                  {TREATMENTS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Additional Complaint/Notes */}
              <div>
                <label className="text-[11px] uppercase font-mono tracking-wider text-[#9E9B95] block mb-1.5">
                  4. Symptoms / Notes to Doctor (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Tooth ache on bottom left molars, sensitive to hot beverages..."
                  rows={2}
                  className="w-full text-xs text-[#2B2925] bg-white border border-[#EBE8E0] rounded-lg p-3 outline-none focus:ring-1 focus:ring-lavender-300 resize-none placeholder-[#C0BCB5]"
                />
              </div>

              {/* Error messages block */}
              {errorMsg && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex items-start space-x-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Lavender action button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-lavender-100 hover:bg-lavender-200 text-[#493E7D] hover:text-[#383063] font-medium text-xs py-3 rounded-lg transition-colors border border-lavender-200 shadow-sm flex items-center justify-center space-x-1"
                style={{ backgroundColor: '#E6E6FA' }} // Inlined for styling visual fallback, though class covers it
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    <span>Reserving Slot...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-1" />
                    <span>Confirm Booking</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        ) : (
          /* Booking Success Animation Screen */
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center text-center py-10"
          >
            <div className="w-14 h-14 bg-green-50 border border-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            
            <span className="text-[10px] uppercase font-mono tracking-wider text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded">
              Reservation Confirmed
            </span>

            <h3 className="font-serif text-2xl font-semibold text-[#2B2925] mt-3">All Set, Patient!</h3>
            <p className="text-xs text-[#5E5B55] mt-2 max-w-xs leading-relaxed">
              Your appointment has been registered inside our clinical schedule successfully.
            </p>

            <div className="bg-[#FAF9F6] border border-[#EBE8E0]/70 p-4 rounded-xl text-left w-full max-w-sm mt-6 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#9E9B95] font-mono">Specialist:</span>
                <span className="font-serif font-semibold text-[#2B2925]">{successApp.doctorId?.name || doctor.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9E9B95] font-mono">Scheduled:</span>
                <span className="font-semibold text-[#2B2925]">{selectedDate} at {selectedSlot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9E9B95] font-mono">Therapy Type:</span>
                <span className="font-semibold text-lavender-900">{treatmentType}</span>
              </div>
              {notes && (
                <div className="border-t border-[#EBE8E0]/30 pt-2 mt-1">
                  <span className="text-[#9E9B95] font-mono block">Symptoms Note:</span>
                  <p className="text-[#5E5B55] mt-1 italic">"{notes}"</p>
                </div>
              )}
            </div>

            <p className="text-[10px] text-[#9E9B95] font-mono mt-6 animate-pulse">
              Syncing patient dashboard in 3s...
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
