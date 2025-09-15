'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './discovery.module.css';

interface TimeSlot {
  time: string;
  available: boolean;
  startIso?: string;
  endIso?: string;
}

interface FormData {
  name: string;
  phone: string;
  selectedDate: string;
  selectedTime: string;
  projectDetails: string;
  projectType: string;
  budget: string;
  timeline: string;
  targetAudience: string;
  keyFeatures: string;
  inspiration: string;
  businessGoals: string;
}

const BUSINESS_HOURS = {
  start: 9, // 9 AM
  end: 17,  // 5 PM
  interval: 30 // 30 minutes
};

const WEEKDAYS = [1, 2, 3, 4, 5]; // Monday to Friday

export default function DiscoveryPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    selectedDate: '',
    selectedTime: '',
    projectDetails: '',
    projectType: '',
    budget: '',
    timeline: '',
    targetAudience: '',
    keyFeatures: '',
    inspiration: '',
    businessGoals: ''
  });
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [dateAvailability, setDateAvailability] = useState<Record<string, boolean>>({});
  const [slotIso, setSlotIso] = useState<{ startIso?: string; endIso?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flow, setFlow] = useState<'onboarding' | 'direct'>('direct');

  // Initialize flow from query and hydrate optional onboarding info
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const f = (sp.get('flow') || 'direct') as 'onboarding' | 'direct';
      setFlow(f);
      if (f === 'onboarding') {
        try {
          const i = JSON.parse(localStorage.getItem('__onboarding_intro') || '{}');
          const d = JSON.parse(localStorage.getItem('__onboarding_details') || '{}');
          setFormData(prev => ({ ...prev, projectType: i.projectType || prev.projectType, projectDetails: (i.goal || '') + (prev.projectDetails ? ('\n' + prev.projectDetails) : ''), budget: d.budget || prev.budget, timeline: d.timeline || prev.timeline }));
        } catch {}
      }
    }
  }, []);

  // Auto-fetch earliest slot from API (with 24h buffer)
  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await fetch('/api/discovery/earliest', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;

        // fill legacy fields for UI render as well
        setFormData(prev => ({
          ...prev,
          selectedDate: data.date,
          selectedTime: data.time,
          // keep extra fields in state via any cast if needed
        }));
        setSlotIso({ startIso: data.startIso, endIso: data.endIso });

        // Build a window (10 days) from the earliest valid date; we'll keep the first 3 with availability
        const fmt = (dt: Date) => `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
        const base = new Date(data.date);
        base.setHours(0,0,0,0);
        const dates: string[] = [];
        for (let i = 0; i < 10; i++) {
          dates.push(fmt(new Date(base.getTime() + i*24*60*60*1000)));
        }
        // Preload availability, then pick the first 3 available dates
        try {
          const results = await Promise.allSettled(
            dates.map(date => fetch(`/api/discovery/day-availability?date=${encodeURIComponent(date)}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : { slots: [] }))
          );
          const map: Record<string, boolean> = {};
          results.forEach((r, idx) => {
            const ok = r.status === 'fulfilled' && Array.isArray((r.value as any).slots) && (r.value as any).slots.length > 0;
            map[dates[idx]] = ok;
          });
          setDateAvailability(map);
          // Choose the first three dates that have availability
          const filtered = dates.filter(d => map[d] !== false).slice(0, 3);
          setAvailableDates(filtered);
          // load time slots for the first available date
          const firstDate = filtered[0] || dates[0];
          setFormData(prev => ({ ...prev, selectedDate: firstDate }));
          await loadDaySlots(firstDate);
        } catch {
          const fallback = dates.slice(0, 3);
          setAvailableDates(fallback);
          await loadDaySlots(fallback[0]);
        }
      } catch {}
    }
    run();
    return () => { cancelled = true; };
  }, []);

  // Generate time slots for selected date
  useEffect(() => {
    if (formData.selectedDate) {
      generateTimeSlots(formData.selectedDate);
    }
  }, [formData.selectedDate]);

  // Auto-fill name and email from browser
  useEffect(() => {
    // Try to get autofill values from browser storage or common autofill patterns
    const storedName = localStorage.getItem('user_name') || '';
    const storedEmail = localStorage.getItem('user_email') || '';
    
    setFormData(prev => ({
      ...prev,
      name: storedName,
      email: storedEmail
    }));
  }, []);

  const generateTimeSlots = (date: string) => {
    const slots: TimeSlot[] = [];
    const selectedDate = new Date(date);
    const now = new Date();
    
    for (let hour = BUSINESS_HOURS.start; hour < BUSINESS_HOURS.end; hour++) {
      for (let minute = 0; minute < 60; minute += BUSINESS_HOURS.interval) {
        const timeSlot = new Date(selectedDate);
        timeSlot.setHours(hour, minute, 0, 0);
        
        // Check if this time slot is in the future
        const isAvailable = timeSlot > now;
        
        const timeString = timeSlot.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        
        slots.push({
          time: timeString,
          available: isAvailable
        });
      }
    }
    
    setTimeSlots(slots);
    
    // Auto-select the first available time slot
    const firstAvailable = slots.find(slot => slot.available);
    if (firstAvailable) {
      setFormData(prev => ({ ...prev, selectedTime: firstAvailable.time }));
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Store name and phone in localStorage for future autofill
    if (field === 'name' && value) {
      localStorage.setItem('user_name', value);
    }
    if (field === 'phone' && value) {
      localStorage.setItem('user_phone', value);
    }
  };

  async function loadDaySlots(date: string) {
    try {
      setLoadingSlots(true);
      const resp = await fetch(`/api/discovery/day-availability?date=${encodeURIComponent(date)}`, { cache: 'no-store' });
      if (!resp.ok) return;
      const data = await resp.json();
      const slots: TimeSlot[] = (data.slots || []).map((s: any) => ({ time: s.time, available: true, startIso: s.startIso, endIso: s.endIso }));
      setTimeSlots(slots);
      if (slots.length > 0) {
        setFormData(prev => ({ ...prev, selectedTime: slots[0].time }));
        setSlotIso({ startIso: slots[0].startIso, endIso: slots[0].endIso });
      } else {
        setFormData(prev => ({ ...prev, selectedTime: '' }));
        setSlotIso(null);
      }
    } catch {}
    finally { setLoadingSlots(false); }
  }

  const selectDate = async (date: string) => {
    setFormData(prev => ({ ...prev, selectedDate: date }));
    await loadDaySlots(date);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.selectedDate || !formData.selectedTime) {
      setError('Please fill in all required fields');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Book the calendar appointment
      const response = await fetch('/api/discovery/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          startIso: slotIso?.startIso,
          endIso: slotIso?.endIso,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to book the discovery call');
      }
      
      const result = await response.json();
      
      // Redirect to success page with booking details
      router.push(`/discovery/success?bookingId=${result.bookingId}`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while booking your call');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Schedule Your Discovery Call</h1>
        <p>Pick a time that works. We 0ll send a Meet link.</p>
      </div>

      <form onSubmit={handleSubmit} className={`${styles.form} ${styles.scheduleGrid}`}>
        {error && <div className={styles.error}>{error}</div>}
        
        <div className={styles.section}>
          <h2>Select Date & Time</h2>
          
          <div className={styles.dateGrid}>
            {availableDates
              .filter(date => dateAvailability[date] !== false)
              .map((date) => (
                <button
                  key={date}
                  type="button"
                  className={`${styles.dateButton} ${formData.selectedDate === date ? styles.selected : ''}`}
                  onClick={() => selectDate(date)}
                >
                  <div className={styles.dateLabel}>
                    {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={styles.dateNumber}>
                    {new Date(date).getDate()}
                  </div>
                </button>
              ))}
          </div>

          <div className={styles.timeArea}>
            {loadingSlots ? (
              <div className={styles.timeGridLoading}>
                <div className={styles.miniSpinner} />
              </div>
            ) : (
              timeSlots.length > 0 ? (
                <div className={styles.timeGrid}>
                  {timeSlots.filter(slot => slot.available).map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      className={`${styles.timeButton} ${formData.selectedTime === slot.time ? styles.selected : ''}`}
                      onClick={() => { setSlotIso({ startIso: slot.startIso, endIso: slot.endIso }); handleInputChange('selectedTime', slot.time); }}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              ) : (
                <div className={styles.timeGridLoading}><span>No times available for this date.</span></div>
              )
            )}
          </div>
        </div>

        <div className={styles.section} style={{maxWidth:'960px',margin:'0 auto'}}>
          <h2>Your Information</h2>
          
          <div className={styles.inputGroup}>
            <label htmlFor="name">Full Name *</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter your full name"
              autoComplete="name"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="phone">Phone Number *</label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="(555) 555-5555"
              autoComplete="tel"
              required
            />
          </div>

          <div className={styles.summary} style={{marginTop:'12px'}}>
          <h3>Meeting Summary</h3>
          <div className={styles.summaryDetails}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Date:</span>
              <span>{formData.selectedDate ? formatDate(formData.selectedDate) : 'Not selected'}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Time:</span>
              <span>{formData.selectedTime || 'Not selected'}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Duration:</span>
              <span>30 minutes</span>
            </div>
          </div>
          </div>

          <div style={{display:'flex',justifyContent:'flex-end',gap:'12px',marginTop:'10px'}}>
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isLoading || !formData.name || !formData.phone || !formData.selectedDate || !formData.selectedTime}
          >
            {isLoading ? 'Booking Your Call...' : 'Book Discovery Call'}
          </button>
          </div>
        </div>
      </form>
    </div>
  );
} 