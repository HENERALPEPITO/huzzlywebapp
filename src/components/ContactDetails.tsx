'use client';

import { Clock, Users } from 'lucide-react';

export default function ContactDetails({ contact }: { contact?: any }) {
  if (!contact) {
    return (
      <aside className="h-full flex items-center justify-center bg-gray-50/50 p-4">
        <p className="text-sm text-gray-400">Select a conversation to view details</p>
      </aside>
    );
  }

  const name = contact.name || 'Monday Group';

  return (
    <aside className="h-full bg-gray-50/50 p-5">
      <div className="bg-white rounded-2xl shadow-sm p-6" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <div className="flex flex-col items-center text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
            style={{ backgroundColor: '#E8D5B7' }}
          >
            <span className="text-xl font-semibold text-gray-700">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>

          <h3 className="font-semibold text-gray-800 text-base">{name}</h3>
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>{name}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>Created on: 1/22/2026</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
