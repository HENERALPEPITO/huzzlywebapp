'use client';

import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactDetails({ contact }: { contact?: any }) {
  const c = contact || { name: 'Jane Doe', role: 'Picker/Packer', email: 'janedoe@gmail.com', phone: '+1 222 002 2001', address: '512 West Street San Francisco', rating: 4.9 };

  return (
    <aside className="w-72 p-4">
      <div className="bg-white rounded-xl shadow-sm p-5" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#E6EEF9] flex items-center justify-center text-[var(--huzly-800)] font-semibold text-xl">{c.name.charAt(0)}</div>
          <div>
            <p className="text-[var(--neutral-700)] font-semibold text-lg">{c.name}</p>
            <p className="text-[var(--neutral-500)] text-sm">{c.role}</p>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-sm text-[var(--neutral-600)]">
          <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> <span>{c.email}</span></div>
          <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> <span>{c.phone}</span></div>
          <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> <span>{c.address}</span></div>
        </div>

        <div className="mt-5 border-t pt-4">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><span className="text-[var(--neutral-600)]">⭐ Trust Rating</span><span className="font-semibold">4.9</span></div>
            <div className="flex items-center justify-between"><span className="text-[var(--neutral-600)]">📅 Shifts</span><span className="font-semibold">594</span></div>
            <div className="flex items-center justify-between"><span className="text-[var(--neutral-600)]">🕒 Since</span><span className="font-semibold">2021</span></div>
            <div className="flex items-center justify-between"><span className="text-[var(--neutral-600)]">💰 Total Earnings</span><span className="font-semibold">$50,201</span></div>
            <div className="flex items-center justify-between"><span className="text-[var(--neutral-600)]">🏢 Employers</span><span className="font-semibold">310</span></div>
          </div>
        </div>
      </div>
    </aside>
  );
}
