import { useState, useRef, useEffect } from 'react';

const API_BASE = 'http://localhost:5000';

function SchemeCard({ scheme }) {
  return (
    <div className="bg-white border border-border rounded-md p-4 flex-1 min-w-[260px]">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-semibold text-muted uppercase tracking-wide">
          Central Scheme
        </span>
        <span className="text-xs px-2 py-0.5 rounded-sm border border-secondary text-secondary bg-secondary-light font-semibold">
          Verified
        </span>
      </div>
      <h3 className="font-serif font-semibold text-lg text-primary mb-2">
        {scheme.scheme_name}
      </h3>
      <p className="text-sm text-muted mb-3">{scheme.description}</p>

      <div className="border-t border-border pt-3 mb-3">
        <p className="text-xs text-muted mb-1">Benefit</p>
        <p className="text-base font-serif font-semibold text-primary">{scheme.benefits}</p>
      </div>

      <div className="border-t border-border pt-3 mb-4">
        <p className="text-xs font-semibold text-primary mb-1">Eligibility</p>
        <ul className="text-sm text-muted space-y-1">
          {scheme.eligibility && Object.entries(scheme.eligibility).map(([key, value]) => (
            <li key={key}>✓ {value}</li>
          ))}
        </ul>