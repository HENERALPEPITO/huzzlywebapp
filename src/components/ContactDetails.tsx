'use client';

import { Mail, Phone, MapPin, Star, Calendar, Clock, DollarSign, Building2 } from 'lucide-react';

export default function ContactDetails({ contact }: { contact?: any }) {
  if (!contact) {
    return (
      <aside className="h-full flex items-center justify-center bg-gray-50/50 p-4">
        <p className="text-sm text-gray-400">Select a conversation to view details</p>
      </aside>
    );
  }

  const name = contact.name || 'Jane Doe';
  const initial = name.charAt(0).toUpperCase();

  return (
    <aside className="h-full bg-gray-50/50 overflow-y-auto">
      <div className="p-5">
        <div className="bg-white rounded-2xl shadow-sm p-6" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          <div className="flex flex-col items-center text-center mb-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: '#E8D5B7' }}
            >
              <span className="text-2xl font-semibold text-gray-700">{initial}</span>
            </div>
            <h3 className="font-bold text-gray-800 text-base">{name}</h3>
            <p className="text-xs text-[#1E3A5F]">Picker/Packer</p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-xs text-gray-500">4.9 Ratings</span>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-gray-600">
              <Mail className="w-4 h-4 text-[#1E3A5F] flex-shrink-0" />
              <span className="truncate">janedoe@gmail.com</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Phone className="w-4 h-4 text-[#1E3A5F] flex-shrink-0" />
              <span>+23 1221 002 2001</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <MapPin className="w-4 h-4 text-[#1E3A5F] flex-shrink-0" />
              <span>512 West Street San Francisco</span>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <Star className="w-4 h-4" />
                <span>Trust Rating</span>
              </div>
              <span className="font-semibold text-gray-800">4.9</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>Shifts</span>
              </div>
              <span className="font-semibold text-gray-800">594</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Since</span>
              </div>
              <span className="font-semibold text-gray-800">2021</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <DollarSign className="w-4 h-4" />
                <span>Total Earnings</span>
              </div>
              <span className="font-semibold text-gray-800">$50,201</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <Building2 className="w-4 h-4" />
                <span>Total Employers</span>
              </div>
              <span className="font-semibold text-gray-800">310</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
