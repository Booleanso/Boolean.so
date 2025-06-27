'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './discovery.module.css';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface FormData {
  name: string;
  email: string;
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
    email: '',
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate available dates (next 14 business days)
  useEffect(() => {
    const dates: string[] = [];
    const today = new Date();
    let currentDate = new Date(today);
    
    while (dates.length < 14) {
      // Check if it's a weekday (Monday = 1, Friday = 5)
      if (WEEKDAYS.includes(currentDate.getDay())) {
        dates.push(currentDate.toISOString().split('T')[0]);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    setAvailableDates(dates);
    
    // Auto-select the first available date
    if (dates.length > 0) {
      setFormData(prev => ({ ...prev, selectedDate: dates[0] }));
    }
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
    
    // Store name and email in localStorage for future autofill
    if (field === 'name' && value) {
      localStorage.setItem('user_name', value);
    }
    if (field === 'email' && value) {
      localStorage.setItem('user_email', value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.selectedDate || !formData.selectedTime) {
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
        body: JSON.stringify(formData),
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
        <p>Let's discuss your project and explore how we can help bring your vision to life.</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.error}>{error}</div>}
        
        <div className={styles.section}>
          <h2>Select Date & Time</h2>
          
          <div className={styles.dateGrid}>
            {availableDates.map((date) => (
              <button
                key={date}
                type="button"
                className={`${styles.dateButton} ${formData.selectedDate === date ? styles.selected : ''}`}
                onClick={() => handleInputChange('selectedDate', date)}
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

          {timeSlots.length > 0 && (
            <div className={styles.timeGrid}>
              {timeSlots.filter(slot => slot.available).map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  className={`${styles.timeButton} ${formData.selectedTime === slot.time ? styles.selected : ''}`}
                  onClick={() => handleInputChange('selectedTime', slot.time)}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.section}>
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
            <label htmlFor="email">Email Address *</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email address"
              autoComplete="email"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="projectDetails">Tell us about your project (optional)</label>
            <textarea
              id="projectDetails"
              value={formData.projectDetails}
              onChange={(e) => handleInputChange('projectDetails', e.target.value)}
              placeholder="Briefly describe your project, goals, and any specific requirements..."
              rows={4}
            />
          </div>
        </div>

        <div className={styles.section}>
          <h2>Project Details (Optional)</h2>
          <p className={styles.sectionDescription}>
            Help us prepare for our call by sharing more details about your project. This information will be included in our meeting notes.
          </p>
          
          <div className={styles.inputGroup}>
            <label htmlFor="projectType">What type of project is this?</label>
            <select
              id="projectType"
              value={formData.projectType}
              onChange={(e) => handleInputChange('projectType', e.target.value)}
            >
              <option value="">Select project type</option>
              <option value="website">Website</option>
              <option value="web-app">Web Application</option>
              <option value="mobile-app">Mobile App</option>
              <option value="e-commerce">E-commerce Store</option>
              <option value="saas">SaaS Platform</option>
              <option value="redesign">Website Redesign</option>
              <option value="maintenance">Website Maintenance</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="budget">What's your budget range?</label>
            <select
              id="budget"
              value={formData.budget}
              onChange={(e) => handleInputChange('budget', e.target.value)}
            >
              <option value="">Select budget range</option>
              <option value="under-5k">Under $5,000</option>
              <option value="5k-10k">$5,000 - $10,000</option>
              <option value="10k-25k">$10,000 - $25,000</option>
              <option value="25k-50k">$25,000 - $50,000</option>
              <option value="50k-100k">$50,000 - $100,000</option>
              <option value="over-100k">Over $100,000</option>
              <option value="flexible">Flexible/To be discussed</option>
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="timeline">When do you need this completed?</label>
            <select
              id="timeline"
              value={formData.timeline}
              onChange={(e) => handleInputChange('timeline', e.target.value)}
            >
              <option value="">Select timeline</option>
              <option value="asap">ASAP</option>
              <option value="1-month">Within 1 month</option>
              <option value="2-3-months">2-3 months</option>
              <option value="3-6-months">3-6 months</option>
              <option value="6-12-months">6-12 months</option>
              <option value="flexible">Flexible timeline</option>
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="targetAudience">Who is your target audience?</label>
            <input
              id="targetAudience"
              type="text"
              value={formData.targetAudience}
              onChange={(e) => handleInputChange('targetAudience', e.target.value)}
              placeholder="e.g., Small business owners, Young professionals, E-commerce shoppers..."
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="keyFeatures">What key features do you need?</label>
            <textarea
              id="keyFeatures"
              value={formData.keyFeatures}
              onChange={(e) => handleInputChange('keyFeatures', e.target.value)}
              placeholder="List the main features or functionality you need..."
              rows={3}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="inspiration">Any websites or apps that inspire you?</label>
            <input
              id="inspiration"
              type="text"
              value={formData.inspiration}
              onChange={(e) => handleInputChange('inspiration', e.target.value)}
              placeholder="Share URLs or names of sites/apps you like..."
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="businessGoals">What are your main business goals for this project?</label>
            <textarea
              id="businessGoals"
              value={formData.businessGoals}
              onChange={(e) => handleInputChange('businessGoals', e.target.value)}
              placeholder="e.g., Increase sales, improve user experience, launch new product..."
              rows={3}
            />
          </div>
        </div>

        <div className={styles.summary}>
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

        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={isLoading || !formData.name || !formData.email || !formData.selectedDate || !formData.selectedTime}
        >
          {isLoading ? 'Booking Your Call...' : 'Book Discovery Call'}
        </button>
      </form>
    </div>
  );
} 