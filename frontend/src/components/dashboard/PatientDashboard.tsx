import React, { useState } from 'react';
import {
  HeartHandshake,
  Calendar,
  CheckCircle2,
  Clock,
  PhoneCall,
  Video,
  Pill,
  FileText,
  CreditCard,
  Plus,
  AlertCircle,
  ShieldCheck,
  Send
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PatientAppointment } from '../../types';
import { Modal } from '../common/Modal';

export const PatientDashboard: React.FC = () => {
  const { currentUser } = useAuth();

  const [appointments, setAppointments] = useState<PatientAppointment[]>([
    {
      id: 1,
      doctor_name: 'Dr. Alexander Vance',
      department: 'Cardiology & Internal Medicine',
      date_time: 'Tomorrow, 10:30 AM',
      status: 'Confirmed',
      room: 'Suite 402, Main Tower',
      type: 'In-Person'
    },
    {
      id: 2,
      doctor_name: 'Dr. Elena Rostova',
      department: 'Pulmonary & Respiratory Care',
      date_time: 'Thursday, Oct 29 &bull; 02:00 PM',
      status: 'Confirmed',
      room: 'CarePlus Telehealth Room 3',
      type: 'Telehealth Video'
    },
    {
      id: 3,
      doctor_name: 'Central Diagnostic Lab',
      department: 'Comprehensive Metabolic Blood Panel',
      date_time: 'Friday, Oct 30 &bull; 08:15 AM',
      status: 'Pending',
      room: 'Diagnostic Pavilion Floor 1',
      type: 'In-Person'
    }
  ]);

  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Booking Form State
  const [doctorName, setDoctorName] = useState('Dr. Alexander Vance');
  const [department, setDepartment] = useState('Cardiology');
  const [appointmentType, setAppointmentType] = useState<'In-Person' | 'Telehealth Video'>('In-Person');
  const [date, setDate] = useState('');

  // Ticket Form State
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    const newApt: PatientAppointment = {
      id: Date.now(),
      doctor_name: doctorName,
      department,
      date_time: date || 'Next Available Slot',
      status: 'Confirmed',
      room: appointmentType === 'Telehealth Video' ? 'CarePlus Video Call' : 'Outpatient Clinic Floor 2',
      type: appointmentType
    };
    setAppointments([newApt, ...appointments]);
    setIsBookModalOpen(false);
    setFeedbackMsg(`Appointment with ${doctorName} successfully scheduled!`);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleTicket = (e: React.FormEvent) => {
    e.preventDefault();
    setIsTicketModalOpen(false);
    setTicketSubject('');
    setTicketMessage('');
    setFeedbackMsg('Support inquiry submitted. A clinic representative will contact you within 2 business hours.');
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Patient Services Status
  const patientServices = [
    { name: 'Patient Health Portal', icon: HeartHandshake, status: 'Operational', desc: 'Medical records & test result downloads' },
    { name: 'Telehealth Video Consultations', icon: Video, status: 'Operational', desc: 'Secure HD video visits with doctors' },
    { name: 'Prescription Refill Service', icon: Pill, status: 'Operational', desc: 'Automatic e-refill dispatch to pharmacy' },
    { name: 'Online Bill Pay & Copays', icon: CreditCard, status: 'Operational', desc: 'Instant credit card & HSA processing' },
  ];

  return (
    <div className="space-y-6">
      {/* Patient Welcome Header */}
      <div className="bg-gradient-to-r from-emerald-700 via-[#16A34A] to-teal-800 text-white p-6 rounded-3xl shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-900/60 text-emerald-200 text-[10px] font-bold uppercase tracking-wider border border-emerald-400/20">
              Patient Portal Point of View
            </span>
            <span className="text-xs text-emerald-100">&bull; ID: {currentUser.patient_id || 'PT-88219'}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            Welcome, {currentUser.name}
          </h1>
          <p className="text-xs text-emerald-100 mt-1 max-w-xl">
            View your upcoming clinical consultations, book appointments, and check live availability of hospital digital services.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsBookModalOpen(true)}
            className="px-4 py-2 bg-white text-[#166534] hover:bg-emerald-50 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Book Appointment</span>
          </button>
          <button
            onClick={() => setIsTicketModalOpen(true)}
            className="px-4 py-2 bg-emerald-800/80 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold transition-all border border-emerald-600/50 flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Need Help?</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 bg-[#DCFCE7] border border-[#BBF7D0] text-[#166534] rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Patient Health Services Availability */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-[#1F2937]">Patient Services & Availability</h3>
            <p className="text-xs text-[#64748B]">Real-time status of services available to you</p>
          </div>
          <span className="text-xs font-semibold text-[#166534] bg-[#DCFCE7] px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-[#BBF7D0]">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
            All Patient Systems Online
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {patientServices.map((svc, i) => {
            const Icon = svc.icon;
            return (
              <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle hover:shadow-card transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#166534]">
                      {svc.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-800">{svc.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-1">{svc.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Appointments Section */}
      <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-subtle">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[#1F2937]">My Appointments & Consultations</h3>
            <p className="text-xs text-[#64748B]">Your upcoming clinic visits and telehealth video sessions</p>
          </div>
          <button
            onClick={() => setIsBookModalOpen(true)}
            className="text-xs font-bold text-[#16A34A] hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Another</span>
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {appointments.map(apt => (
            <div key={apt.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-2xl mt-0.5 ${
                  apt.type === 'Telehealth Video' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {apt.type === 'Telehealth Video' ? <Video className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs text-slate-900">{apt.doctor_name}</h4>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      apt.type === 'Telehealth Video' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {apt.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{apt.department}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{apt.date_time}</span>
                    <span>&bull;</span>
                    <span>{apt.room}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]">
                  {apt.status}
                </span>
                {apt.type === 'Telehealth Video' && (
                  <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors">
                    Join Video Call
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Book Appointment Modal */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title="Book a Medical Consultation"
        description="Select a specialist physician or clinic service"
      >
        <form onSubmit={handleBook} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Doctor / Specialist</label>
            <select
              value={doctorName}
              onChange={e => setDoctorName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#16A34A]"
            >
              <option value="Dr. Alexander Vance">Dr. Alexander Vance (Cardiology & Internal Medicine)</option>
              <option value="Dr. Elena Rostova">Dr. Elena Rostova (Pulmonary & Respiratory Care)</option>
              <option value="Dr. Marcus Thorne">Dr. Marcus Thorne (Orthopedic Surgery)</option>
              <option value="Dr. Maya Patel">Dr. Maya Patel (Pediatrics & Family Medicine)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Consultation Format</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAppointmentType('In-Person')}
                className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                  appointmentType === 'In-Person' ? 'bg-[#DCFCE7] text-[#166534] border-[#16A34A]' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                In-Person Hospital Visit
              </button>
              <button
                type="button"
                onClick={() => setAppointmentType('Telehealth Video')}
                className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                  appointmentType === 'Telehealth Video' ? 'bg-blue-100 text-blue-800 border-blue-500' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                Telehealth Video Call
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Preferred Date & Time</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#16A34A]"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsBookModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white font-bold shadow-xs"
            >
              Confirm Booking
            </button>
          </div>
        </form>
      </Modal>

      {/* Support Ticket Modal */}
      <Modal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        title="Patient Support Inquiry"
        description="Send a message to our clinical support and patient advocacy desk"
      >
        <form onSubmit={handleTicket} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Subject</label>
            <input
              type="text"
              value={ticketSubject}
              onChange={e => setTicketSubject(e.target.value)}
              placeholder="e.g. Prescription refill inquiry or appointment reschedule"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#16A34A]"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Message</label>
            <textarea
              rows={3}
              value={ticketMessage}
              onChange={e => setTicketMessage(e.target.value)}
              placeholder="Describe your question or request in detail..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#16A34A]"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsTicketModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white font-bold shadow-xs"
            >
              Submit Inquiry
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
