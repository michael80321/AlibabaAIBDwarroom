'use client';

import { useState, useEffect, useCallback } from 'react';
import CustomerCard from '@/components/CustomerCard';

const PRIORITY_TABS = ['All', 'Attack Now', 'Nurture', 'Partner First', 'Monitor', 'Cold', 'Dead'];
const ENTRY_POINTS = ['AI', 'GPU', 'CDN', 'Global', 'China', 'China Access', 'Cost', 'SEA'];
const INDUSTRIES = ['Cybersecurity', 'Live Streaming', 'EV / IoT', 'Music Streaming', 'AI / AdTech', 'Data / AI'];

interface Customer {
  id: string;
  company_name: string;
  industry?: string | null;
  region?: string | null;
  priority_label: string;
  priority_score: number;
  entry_points: string[];
  current_cloud?: string | null;
  why_now?: string | null;
  estimated_arr?: number | null;
  last_contacted?: string | null;
}

export default function ProspectsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [selectedEntryPoints, setSelectedEntryPoints] = useState<string[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [search, setSearch] = useState('');

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeTab !== 'All') params.set('label', activeTab);
    if (selectedEntryPoints.length === 1) params.set('entry_point', selectedEntryPoints[0]);
    if (selectedIndustry) params.set('industry', selectedIndustry);
    if (search) params.set('search', search);

    const res = await fetch(`/api/customers?${params}`);
    const data = await res.json();
    setCustomers(data);
    setLoading(false);
  }, [activeTab, selectedEntryPoints, selectedIndustry, search]);

  useEffect(() => {
    const timer = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  const toggleEntryPoint = (ep: string) => {
    setSelectedEntryPoints((prev) =>
      prev.includes(ep) ? prev.filter((p) => p !== ep) : [...prev, ep]
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">🎯 潛在客戶</h1>
        <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg px-4 py-2">
          <p className="text-amber-300 text-sm">
            今日行動：重點關注 <strong>Attack Now</strong> 客戶，優先聯絡評分 80+ 且超過 7 天未聯的客戶
          </p>
        </div>
      </div>

      {/* Priority Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {PRIORITY_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white text-gray-900'
                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        {/* Search */}
        <input
          type="text"
          placeholder="搜尋公司名稱..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 w-48"
        />

        {/* Industry Filter */}
        <select
          value={selectedIndustry}
          onChange={(e) => setSelectedIndustry(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">所有產業</option>
          {INDUSTRIES.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>

        {/* Entry Point Filter */}
        <div className="flex flex-wrap gap-1">
          {ENTRY_POINTS.map((ep) => (
            <button
              key={ep}
              onClick={() => toggleEntryPoint(ep)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedEntryPoints.includes(ep)
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {ep}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="text-gray-500 text-sm animate-pulse">載入中...</div>
        </div>
      ) : (
        <>
          <p className="text-gray-500 text-xs mb-3">共 {customers.length} 筆</p>
          <div className="grid grid-cols-3 gap-4">
            {customers.map((customer) => (
              <CustomerCard key={customer.id} customer={customer} />
            ))}
            {customers.length === 0 && (
              <div className="col-span-3 text-center py-12 text-gray-600">
                沒有符合條件的客戶
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
