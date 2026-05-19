import React, { useState, useEffect } from 'react';
import { getContactData } from '../../api/contactus';
import { CustomDatePicker } from '../ui/CustomDatePicker';

const RequestPage = () => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchContactData();
  }, []);

  useEffect(() => {
    applyDateFilter();
  }, [contacts, startDate, endDate]);

  const applyDateFilter = () => {
    if (!startDate || !endDate) {
      setFilteredContacts(contacts);
      return;
    }

    const filtered = contacts.filter(contact => {
      const contactDate = new Date(contact.created_at);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include end date
      
      return contactDate >= start && contactDate <= end;
    });
    
    setFilteredContacts(filtered);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  const fetchContactData = async () => {
    try {
      setLoading(true);
      const response = await getContactData();
      const results = response.results || [];
      const sortedResults = [...results].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setContacts(sortedResults);
      setError(null);
    } catch (err) {
      setError('Failed to fetch contact data');
      console.error('Error fetching contact data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const TableView = () => (
    <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200">
      <table className="min-w-full bg-white">
        <thead className="bg-gradient-to-r from-amber-800 to-amber-900">
          <tr>
            <th className="px-8 py-5 text-left text-xs font-bold text-white uppercase tracking-wider border-b border-amber-950">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                ID
              </div>
            </th>
            <th className="px-8 py-5 text-left text-xs font-bold text-white uppercase tracking-wider border-b border-amber-950">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Full Name
              </div>
            </th>
            <th className="px-8 py-5 text-left text-xs font-bold text-white uppercase tracking-wider border-b border-amber-950">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Mobile
              </div>
            </th>
            <th className="px-8 py-5 text-left text-xs font-bold text-white uppercase tracking-wider border-b border-amber-950">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
              </div>
            </th>
            <th className="px-8 py-5 text-left text-xs font-bold text-white uppercase tracking-wider border-b border-amber-950">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                Description
              </div>
            </th>
            <th className="px-8 py-5 text-left text-xs font-bold text-white uppercase tracking-wider border-b border-amber-950">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Date
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {filteredContacts.map((contact) => (
            <tr key={contact.id} className="hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 transition-all duration-200 border-b border-amber-100">
              <td className="px-8 py-5 whitespace-nowrap">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  {contact.id}
                </span>
              </td>
              <td className="px-8 py-5 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{contact.full_name.charAt(0).toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-bold text-gray-900">{contact.full_name}</div>
                  </div>
                </div>
              </td>
              <td className="px-8 py-5 whitespace-nowrap">
                <div className="flex items-center text-sm text-gray-700">
                  <svg className="w-4 h-4 mr-2 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {contact.mobile_number}
                </div>
              </td>
              <td className="px-8 py-5 whitespace-nowrap">
                <div className="flex items-center text-sm text-gray-700">
                  <svg className="w-4 h-4 mr-2 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {contact.email_address}
                </div>
              </td>
              <td className="px-8 py-5">
                <div className="text-sm text-gray-700 max-w-sm">
                  <div className="whitespace-normal break-words">{contact.description}</div>
                </div>
              </td>
              <td className="px-8 py-5 whitespace-nowrap">
                <div className="flex items-center text-sm text-gray-700">
                  <svg className="w-4 h-4 mr-2 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(contact.created_at)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Contact Requests</h1>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow-md border border-amber-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900">Date Range Filter</h2>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <CustomDatePicker
              value={startDate}
              onChange={(value) => setStartDate(value)}
              placeholder="dd/mm/yyyy"
              className="w-full"
            />
          </div>
          
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <CustomDatePicker
              value={endDate}
              onChange={(value) => setEndDate(value)}
              placeholder="dd/mm/yyyy"
              className="w-full"
            />
          </div>
          
          <div>
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-4 py-2 border border-amber-300 rounded-md text-sm font-medium text-amber-700 bg-white hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors duration-200 w-full sm:w-auto"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Clear Filters
            </button>
          </div>
        </div>
      </div>
      
      {filteredContacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <div className="text-gray-500 text-lg font-medium">No contact requests found</div>
          <div className="text-gray-400 text-sm mt-1">New requests will appear here</div>
        </div>
      ) : (
        <div>
          <TableView />
        </div>
      )}
    </div>
  );
};

export default RequestPage;