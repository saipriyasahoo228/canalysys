// // import React, { useState, useEffect } from 'react';
// // import { getContactData } from '../../api/contactus';
// // import { CustomDatePicker } from '../ui/CustomDatePicker';

// // const RequestPage = () => {
// //   const [contacts, setContacts] = useState([]);
// //   const [filteredContacts, setFilteredContacts] = useState([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState(null);
// //   const [startDate, setStartDate] = useState('');
// //   const [endDate, setEndDate] = useState('');

// //   useEffect(() => {
// //     fetchContactData();
// //   }, []);

// //   useEffect(() => {
// //     applyDateFilter();
// //   }, [contacts, startDate, endDate]);

// //   const applyDateFilter = () => {
// //     if (!startDate || !endDate) {
// //       setFilteredContacts(contacts);
// //       return;
// //     }

// //     const filtered = contacts.filter(contact => {
// //       const contactDate = new Date(contact.created_at);
// //       const start = new Date(startDate);
// //       const end = new Date(endDate);
// //       end.setHours(23, 59, 59, 999); // Include end date
      
// //       return contactDate >= start && contactDate <= end;
// //     });
    
// //     setFilteredContacts(filtered);
// //   };

// //   const clearFilters = () => {
// //     setStartDate('');
// //     setEndDate('');
// //   };

// //   const fetchContactData = async () => {
// //     try {
// //       setLoading(true);
// //       const response = await getContactData();
// //       const results = response.results || [];
// //       const sortedResults = [...results].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
// //       setContacts(sortedResults);
// //       setError(null);
// //     } catch (err) {
// //       setError('Failed to fetch contact data');
// //       console.error('Error fetching contact data:', err);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const formatDate = (dateString) => {
// //     const date = new Date(dateString);
// //     const day = String(date.getDate()).padStart(2, '0');
// //     const month = String(date.getMonth() + 1).padStart(2, '0');
// //     const year = date.getFullYear();
// //     return `${day}/${month}/${year}`;
// //   };

// //   const TableView = () => (
// //     <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200">
// //       <table className="min-w-full bg-white">
// //         <thead className="bg-gradient-to-r from-amber-800 to-amber-900">
// //           <tr>
// //             <th className="px-8 py-5 text-left text-xs font-bold text-white uppercase tracking-wider border-b border-amber-950">
// //               <div className="flex items-center">
// //                 <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
// //                 </svg>
// //                 ID
// //               </div>
// //             </th>
// //             <th className="px-8 py-5 text-left text-xs font-bold text-white uppercase tracking-wider border-b border-amber-950">
// //               <div className="flex items-center">
// //                 <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
// //                 </svg>
// //                 Full Name
// //               </div>
// //             </th>
// //             <th className="px-8 py-5 text-left text-xs font-bold text-white uppercase tracking-wider border-b border-amber-950">
// //               <div className="flex items-center">
// //                 <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
// //                 </svg>
// //                 Mobile
// //               </div>
// //             </th>
// //             <th className="px-8 py-5 text-left text-xs font-bold text-white uppercase tracking-wider border-b border-amber-950">
// //               <div className="flex items-center">
// //                 <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
// //                 </svg>
// //                 Email
// //               </div>
// //             </th>
// //             <th className="px-8 py-5 text-left text-xs font-bold text-white uppercase tracking-wider border-b border-amber-950">
// //               <div className="flex items-center">
// //                 <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
// //                 </svg>
// //                 Description
// //               </div>
// //             </th>
// //             <th className="px-8 py-5 text-left text-xs font-bold text-white uppercase tracking-wider border-b border-amber-950">
// //               <div className="flex items-center">
// //                 <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
// //                 </svg>
// //                 Date
// //               </div>
// //             </th>
// //           </tr>
// //         </thead>
// //         <tbody className="bg-white divide-y divide-gray-100">
// //           {filteredContacts.map((contact) => (
// //             <tr key={contact.id} className="hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 transition-all duration-200 border-b border-amber-100">
// //               <td className="px-8 py-5 whitespace-nowrap">
// //                 <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
// //                   {contact.id}
// //                 </span>
// //               </td>
// //               <td className="px-8 py-5 whitespace-nowrap">
// //                 <div className="flex items-center">
// //                   <div className="flex-shrink-0 h-10 w-10">
// //                     <div className="h-10 w-10 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 flex items-center justify-center">
// //                       <span className="text-white font-bold text-sm">{contact.full_name.charAt(0).toUpperCase()}</span>
// //                     </div>
// //                   </div>
// //                   <div className="ml-4">
// //                     <div className="text-sm font-bold text-gray-900">{contact.full_name}</div>
// //                   </div>
// //                 </div>
// //               </td>
// //               <td className="px-8 py-5 whitespace-nowrap">
// //                 <div className="flex items-center text-sm text-gray-700">
// //                   <svg className="w-4 h-4 mr-2 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
// //                   </svg>
// //                   {contact.mobile_number}
// //                 </div>
// //               </td>
// //               <td className="px-8 py-5 whitespace-nowrap">
// //                 <div className="flex items-center text-sm text-gray-700">
// //                   <svg className="w-4 h-4 mr-2 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
// //                   </svg>
// //                   {contact.email_address}
// //                 </div>
// //               </td>
// //               <td className="px-8 py-5">
// //                 <div className="text-sm text-gray-700 max-w-sm">
// //                   <div className="whitespace-normal break-words">{contact.description}</div>
// //                 </div>
// //               </td>
// //               <td className="px-8 py-5 whitespace-nowrap">
// //                 <div className="flex items-center text-sm text-gray-700">
// //                   <svg className="w-4 h-4 mr-2 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
// //                   </svg>
// //                   {formatDate(contact.created_at)}
// //                 </div>
// //               </td>
// //             </tr>
// //           ))}
// //         </tbody>
// //       </table>
// //     </div>
// //   );

// //   if (loading) {
// //     return (
// //       <div className="flex justify-center items-center h-64">
// //         <div className="text-lg">Loading...</div>
// //       </div>
// //     );
// //   }

// //   if (error) {
// //     return (
// //       <div className="flex justify-center items-center h-64">
// //         <div className="text-red-500">{error}</div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="p-6">
// //       <div className="flex justify-between items-center mb-6">
// //         <h1 className="text-3xl font-bold text-gray-900">Contact Requests</h1>
// //       </div>

// //       {/* Date Range Filter */}
// //       <div className="bg-white rounded-lg shadow-md border border-amber-200 p-6 mb-6">
// //         <div className="flex items-center justify-between mb-4">
// //           <div className="flex items-center space-x-2">
// //             <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
// //             </svg>
// //             <h2 className="text-lg font-semibold text-gray-900">Date Range Filter</h2>
// //           </div>
// //         </div>
        
// //         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
// //           <div>
// //             <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">
// //               Start Date
// //             </label>
// //             <CustomDatePicker
// //               value={startDate}
// //               onChange={(value) => setStartDate(value)}
// //               placeholder="dd/mm/yyyy"
// //               className="w-full"
// //             />
// //           </div>
          
// //           <div>
// //             <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-2">
// //               End Date
// //             </label>
// //             <CustomDatePicker
// //               value={endDate}
// //               onChange={(value) => setEndDate(value)}
// //               placeholder="dd/mm/yyyy"
// //               className="w-full"
// //             />
// //           </div>
          
// //           <div>
// //             <button
// //               onClick={clearFilters}
// //               className="inline-flex items-center px-4 py-2 border border-amber-300 rounded-md text-sm font-medium text-amber-700 bg-white hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors duration-200 w-full sm:w-auto"
// //             >
// //               <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
// //               </svg>
// //               Clear Filters
// //             </button>
// //           </div>
// //         </div>
// //       </div>
      
// //       {filteredContacts.length === 0 ? (
// //         <div className="flex flex-col items-center justify-center py-12">
// //           <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
// //           </svg>
// //           <div className="text-gray-500 text-lg font-medium">No contact requests found</div>
// //           <div className="text-gray-400 text-sm mt-1">New requests will appear here</div>
// //         </div>
// //       ) : (
// //         <div>
// //           <TableView />
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // export default RequestPage;















// import React, { useState, useEffect } from 'react';
// import { getContactData } from '../../api/contactus';
// import { CustomDatePicker } from '../ui/CustomDatePicker';

// const RequestPage = () => {
//   const [contacts, setContacts] = useState([]);
//   const [filteredContacts, setFilteredContacts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [startDate, setStartDate] = useState('');
//   const [endDate, setEndDate] = useState('');
  
//   // Pagination states
//   const [currentPage, setCurrentPage] = useState(1);
//   const [rowsPerPage, setRowsPerPage] = useState(10);
//   const [paginatedContacts, setPaginatedContacts] = useState([]);

//   useEffect(() => {
//     fetchContactData();
//   }, []);

//   useEffect(() => {
//     applyDateFilter();
//   }, [contacts, startDate, endDate]);

//   useEffect(() => {
//     // Update pagination when filtered contacts change
//     paginateData();
//   }, [filteredContacts, currentPage, rowsPerPage]);

//   const applyDateFilter = () => {
//     if (!startDate || !endDate) {
//       setFilteredContacts(contacts);
//       return;
//     }

//     const filtered = contacts.filter(contact => {
//       const contactDate = new Date(contact.created_at);
//       const start = new Date(startDate);
//       const end = new Date(endDate);
//       end.setHours(23, 59, 59, 999);
      
//       return contactDate >= start && contactDate <= end;
//     });
    
//     setFilteredContacts(filtered);
//     setCurrentPage(1); // Reset to first page when filter changes
//   };

//   const paginateData = () => {
//     if (rowsPerPage === 'all') {
//       setPaginatedContacts(filteredContacts);
//       return;
//     }
    
//     const startIndex = (currentPage - 1) * rowsPerPage;
//     const endIndex = startIndex + rowsPerPage;
//     setPaginatedContacts(filteredContacts.slice(startIndex, endIndex));
//   };

//   const clearFilters = () => {
//     setStartDate('');
//     setEndDate('');
//     setCurrentPage(1);
//   };

//   const fetchContactData = async () => {
//     try {
//       setLoading(true);
//       const response = await getContactData();
//       const results = response.results || [];
//       const sortedResults = [...results].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
//       setContacts(sortedResults);
//       setError(null);
//     } catch (err) {
//       setError('Failed to fetch contact data');
//       console.error('Error fetching contact data:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatDate = (dateString) => {
//     const date = new Date(dateString);
//     const day = String(date.getDate()).padStart(2, '0');
//     const month = String(date.getMonth() + 1).padStart(2, '0');
//     const year = date.getFullYear();
//     return `${day}/${month}/${year}`;
//   };

//   // Handle rows per page change
//   const handleRowsPerPageChange = (e) => {
//     const value = e.target.value;
//     setRowsPerPage(value === 'all' ? 'all' : parseInt(value));
//     setCurrentPage(1);
//   };

//   // Handle page change
//   const handlePageChange = (page) => {
//     setCurrentPage(page);
//   };

//   // Calculate total pages
//   const totalPages = rowsPerPage === 'all' ? 1 : Math.ceil(filteredContacts.length / rowsPerPage);
  
//   // Generate page numbers
//   const getPageNumbers = () => {
//     const pages = [];
//     const maxVisible = 5;
//     let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
//     let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
//     if (endPage - startPage + 1 < maxVisible) {
//       startPage = Math.max(1, endPage - maxVisible + 1);
//     }
    
//     for (let i = startPage; i <= endPage; i++) {
//       pages.push(i);
//     }
    
//     return pages;
//   };

//   const TableView = () => (
//     <div className="overflow-x-auto rounded-xl shadow-lg border border-sky-200">
//       <table className="min-w-full bg-white">
//         <thead className="bg-gradient-to-r from-sky-600 to-sky-700">
//           <tr>
//             <th className="px-8 py-5 text-left text-xs font-bold text-white uppercase tracking-wider">
//               <div className="flex items-center">
//                 <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
//                 </svg>
//                 ID
//               </div>
//             </th>
//             <th className="px-8 py-5 text-left text-xs font-bold text-white uppercase tracking-wider">
//               <div className="flex items-center">
//                 <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
//                 </svg>
//                 Full Name
//               </div>
//             </th>
//             <th className="px-8 py-5 text-left text-xs font-bold text-white uppercase tracking-wider">
//               <div className="flex items-center">
//                 <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
//                 </svg>
//                 Mobile
//               </div>
//             </th>
//             <th className="px-8 py-5 text-left text-xs font-bold text-white uppercase tracking-wider">
//               <div className="flex items-center">
//                 <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
//                 </svg>
//                 Email
//               </div>
//             </th>
//             <th className="px-8 py-5 text-left text-xs font-bold text-white uppercase tracking-wider">
//               <div className="flex items-center">
//                 <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
//                 </svg>
//                 Description
//               </div>
//             </th>
//             <th className="px-8 py-5 text-left text-xs font-bold text-white uppercase tracking-wider">
//               <div className="flex items-center">
//                 <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                 </svg>
//                 Date
//               </div>
//             </th>
//           </tr>
//         </thead>
//         <tbody className="bg-white divide-y divide-gray-100">
//           {paginatedContacts.map((contact) => (
//             <tr key={contact.id} className="hover:bg-gradient-to-r hover:from-sky-50 hover:to-blue-50 transition-all duration-200 border-b border-sky-100">
//               <td className="px-8 py-5 whitespace-nowrap">
//                 <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-800">
//                   {contact.id}
//                 </span>
//               </td>
//               <td className="px-8 py-5 whitespace-nowrap">
//                 <div className="flex items-center">
//                   <div className="flex-shrink-0 h-10 w-10">
//                     <div className="h-10 w-10 rounded-full bg-gradient-to-r from-sky-500 to-sky-600 flex items-center justify-center">
//                       <span className="text-white font-bold text-sm">{contact.full_name?.charAt(0).toUpperCase() || '?'}</span>
//                     </div>
//                   </div>
//                   <div className="ml-4">
//                     <div className="text-sm font-bold text-gray-900">{contact.full_name}</div>
//                   </div>
//                 </div>
//               </td>
//               <td className="px-8 py-5 whitespace-nowrap">
//                 <div className="flex items-center text-sm text-gray-700">
//                   <svg className="w-4 h-4 mr-2 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
//                   </svg>
//                   {contact.mobile_number}
//                 </div>
//               </td>
//               <td className="px-8 py-5 whitespace-nowrap">
//                 <div className="flex items-center text-sm text-gray-700">
//                   <svg className="w-4 h-4 mr-2 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
//                   </svg>
//                   {contact.email_address}
//                 </div>
//               </td>
//               <td className="px-8 py-5">
//                 <div className="text-sm text-gray-700 max-w-sm">
//                   <div className="whitespace-normal break-words">{contact.description || '—'}</div>
//                 </div>
//               </td>
//               <td className="px-8 py-5 whitespace-nowrap">
//                 <div className="flex items-center text-sm text-gray-700">
//                   <svg className="w-4 h-4 mr-2 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                   </svg>
//                   {formatDate(contact.created_at)}
//                 </div>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="flex flex-col items-center gap-3">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
//           <div className="text-lg text-gray-600">Loading contact requests...</div>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="text-red-500 bg-red-50 px-6 py-3 rounded-lg">{error}</div>
//       </div>
//     );
//   }

//   return (
//     <div className="p-6">
//       <div className="flex justify-between items-center mb-6">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900">Contact Requests</h1>
//           <p className="text-sm text-gray-500 mt-1">Manage and respond to customer inquiries</p>
//         </div>
//         <button
//           onClick={fetchContactData}
//           className="inline-flex items-center px-4 py-2 border border-sky-300 rounded-md text-sm font-medium text-sky-700 bg-white hover:bg-sky-50 transition-colors duration-200"
//         >
//           <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//           </svg>
//           Refresh
//         </button>
//       </div>

//       {/* Date Range Filter */}
//       <div className="bg-white rounded-lg shadow-md border border-sky-200 p-6 mb-6">
//         <div className="flex items-center justify-between mb-4">
//           <div className="flex items-center space-x-2">
//             <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//             </svg>
//             <h2 className="text-lg font-semibold text-gray-900">Date Range Filter</h2>
//           </div>
//           <div className="text-sm text-gray-500">
//             Total: {filteredContacts.length} request{filteredContacts.length !== 1 ? 's' : ''}
//           </div>
//         </div>
        
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
//           <div>
//             <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">
//               Start Date
//             </label>
//             <CustomDatePicker
//               value={startDate}
//               onChange={(value) => setStartDate(value)}
//               placeholder="dd/mm/yyyy"
//               className="w-full"
//             />
//           </div>
          
//           <div>
//             <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-2">
//               End Date
//             </label>
//             <CustomDatePicker
//               value={endDate}
//               onChange={(value) => setEndDate(value)}
//               placeholder="dd/mm/yyyy"
//               className="w-full"
//             />
//           </div>
          
//           <div>
//             <button
//               onClick={clearFilters}
//               className="inline-flex items-center px-4 py-2 border border-sky-300 rounded-md text-sm font-medium text-sky-700 bg-white hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors duration-200 w-full sm:w-auto"
//             >
//               <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//               </svg>
//               Clear Filters
//             </button>
//           </div>
//         </div>
//       </div>
      
//       {filteredContacts.length === 0 ? (
//         <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg shadow-md border border-sky-100">
//           <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
//           </svg>
//           <div className="text-gray-500 text-lg font-medium">No contact requests found</div>
//           <div className="text-gray-400 text-sm mt-1">New requests will appear here</div>
//         </div>
//       ) : (
//         <>
//           <TableView />
          
//           {/* Pagination Section */}
//           <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
//             {/* Rows per page selector */}
//             <div className="flex items-center gap-2">
//               <span className="text-sm text-gray-600">Rows per page:</span>
//               <select
//                 value={rowsPerPage}
//                 onChange={handleRowsPerPageChange}
//                 className="border border-sky-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
//               >
//                 <option value={10}>10</option>
//                 <option value={20}>20</option>
//                 <option value={50}>50</option>
//                 <option value="all">All</option>
//               </select>
//             </div>
            
//             {/* Page information */}
//             <div className="text-sm text-gray-600">
//               Showing {rowsPerPage === 'all' ? filteredContacts.length : Math.min((currentPage - 1) * rowsPerPage + 1, filteredContacts.length)} to{' '}
//               {rowsPerPage === 'all' 
//                 ? filteredContacts.length 
//                 : Math.min(currentPage * rowsPerPage, filteredContacts.length)} of {filteredContacts.length} entries
//             </div>
            
//             {/* Pagination buttons */}
//             {rowsPerPage !== 'all' && totalPages > 1 && (
//               <div className="flex items-center gap-1">
//                 <button
//                   onClick={() => handlePageChange(1)}
//                   disabled={currentPage === 1}
//                   className={`px-3 py-1 rounded-md text-sm transition-colors ${
//                     currentPage === 1
//                       ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
//                       : 'bg-white border border-sky-300 text-sky-700 hover:bg-sky-50'
//                   }`}
//                 >
//                   First
//                 </button>
//                 <button
//                   onClick={() => handlePageChange(currentPage - 1)}
//                   disabled={currentPage === 1}
//                   className={`px-3 py-1 rounded-md text-sm transition-colors ${
//                     currentPage === 1
//                       ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
//                       : 'bg-white border border-sky-300 text-sky-700 hover:bg-sky-50'
//                   }`}
//                 >
//                   Previous
//                 </button>
                
//                 {getPageNumbers().map(page => (
//                   <button
//                     key={page}
//                     onClick={() => handlePageChange(page)}
//                     className={`px-3 py-1 rounded-md text-sm transition-colors ${
//                       currentPage === page
//                         ? 'bg-sky-600 text-white'
//                         : 'bg-white border border-sky-300 text-sky-700 hover:bg-sky-50'
//                     }`}
//                   >
//                     {page}
//                   </button>
//                 ))}
                
//                 <button
//                   onClick={() => handlePageChange(currentPage + 1)}
//                   disabled={currentPage === totalPages}
//                   className={`px-3 py-1 rounded-md text-sm transition-colors ${
//                     currentPage === totalPages
//                       ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
//                       : 'bg-white border border-sky-300 text-sky-700 hover:bg-sky-50'
//                   }`}
//                 >
//                   Next
//                 </button>
//                 <button
//                   onClick={() => handlePageChange(totalPages)}
//                   disabled={currentPage === totalPages}
//                   className={`px-3 py-1 rounded-md text-sm transition-colors ${
//                     currentPage === totalPages
//                       ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
//                       : 'bg-white border border-sky-300 text-sky-700 hover:bg-sky-50'
//                   }`}
//                 >
//                   Last
//                 </button>
//               </div>
//             )}
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default RequestPage;











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
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Dialog states for mobile
  const [emailDialog, setEmailDialog] = useState({ open: false, email: '', name: '' });
  const [phoneDialog, setPhoneDialog] = useState({ open: false, phone: '', name: '' });
  const [snack, setSnack] = useState({ open: false, tone: 'success', title: '', message: '' });

  const showSnack = (next) => {
    setSnack({ open: true, tone: next.tone || 'info', title: next.title || '', message: next.message || '' });
    setTimeout(() => {
      setSnack({ open: false, tone: 'success', title: '', message: '' });
    }, 3000);
  };

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
      end.setHours(23, 59, 59, 999);
      
      return contactDate >= start && contactDate <= end;
    });
    
    setFilteredContacts(filtered);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
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

  // Handle email click - opens dialog on mobile/tablet
  const handleEmailClick = (email, name) => {
    if (email && email !== '—') {
      // Check if device is mobile or tablet
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        setEmailDialog({ open: true, email, name });
      } else {
        window.location.href = `mailto:${email}`;
      }
    } else {
      showSnack({ tone: 'warning', title: 'No Email', message: 'No email address available' });
    }
  };

  // Handle phone click - opens dialog on mobile/tablet
  const handlePhoneClick = (phone, name) => {
    if (phone && phone !== '—') {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        setPhoneDialog({ open: true, phone, name });
      } else {
        window.location.href = `tel:${phone}`;
      }
    } else {
      showSnack({ tone: 'warning', title: 'No Phone', message: 'No phone number available' });
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      showSnack({ tone: 'success', title: 'Copied!', message: `${type} copied to clipboard` });
    } catch (err) {
      showSnack({ tone: 'danger', title: 'Error', message: `Failed to copy ${type.toLowerCase()}` });
    }
  };

  // Get current page data
  const getCurrentPageData = () => {
    if (rowsPerPage === 'all') {
      return filteredContacts;
    }
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredContacts.slice(startIndex, endIndex);
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (e) => {
    const value = e.target.value;
    setRowsPerPage(value === 'all' ? 'all' : parseInt(value));
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Calculate total pages
  const totalPages = rowsPerPage === 'all' ? 1 : Math.ceil(filteredContacts.length / rowsPerPage);
  
  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const currentData = getCurrentPageData();

  const TableView = () => (
    <div className="overflow-x-auto rounded-xl shadow-lg border border-sky-200">
      <table className="min-w-full bg-white">
        <thead className="bg-gradient-to-r from-blue-500 to-sky-500">
          <tr>
            <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
              <div className="flex items-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                ID
              </div>
            </th>
            <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
              <div className="flex items-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Full Name
              </div>
            </th>
            <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
              <div className="flex items-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Mobile
              </div>
            </th>
            <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
              <div className="flex items-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
              </div>
            </th>
            <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider hidden md:table-cell">
              <div className="flex items-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                Description
              </div>
            </th>
            <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
              <div className="flex items-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Date
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {currentData.map((contact) => (
            <tr key={contact.id} className="hover:bg-gradient-to-r hover:from-sky-50 hover:to-blue-50 transition-all duration-200">
              <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                <span className="inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-800">
                  {contact.id}
                </span>
              </td>
              <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-r from-sky-500 to-sky-600 flex items-center justify-center">
                      <span className="text-white font-bold text-xs sm:text-sm">{contact.full_name?.charAt(0).toUpperCase() || '?'}</span>
                    </div>
                  </div>
                  <div className="ml-2 sm:ml-4">
                    <div className="text-xs sm:text-sm font-bold text-gray-900">{contact.full_name}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                <button
                  onClick={() => handlePhoneClick(contact.mobile_number, contact.full_name)}
                  className="flex items-center text-xs sm:text-sm text-gray-700 hover:text-sky-600 transition-colors group"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-sky-400 group-hover:text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="truncate max-w-[100px] sm:max-w-none">{contact.mobile_number}</span>
                </button>
              </td>
              <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                <button
                  onClick={() => handleEmailClick(contact.email_address, contact.full_name)}
                  className="flex items-center text-xs sm:text-sm text-gray-700 hover:text-sky-600 transition-colors group"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-sky-400 group-hover:text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="truncate max-w-[120px] sm:max-w-[200px]">{contact.email_address}</span>
                </button>
              </td>
              <td className="px-4 py-3 sm:px-6 sm:py-4 hidden md:table-cell">
                <div className="text-xs sm:text-sm text-gray-700 max-w-xs">
                  <div className="whitespace-normal break-words line-clamp-2">{contact.description || '—'}</div>
                </div>
              </td>
              <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                <div className="flex items-center text-xs sm:text-sm text-gray-700">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(contact.created_at)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        {/* Pagination inside table footer */}
        <tfoot className="bg-sky-50 border-t border-sky-200">
          <tr>
            <td colSpan="6" className="px-4 py-3 sm:px-6 sm:py-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                {/* Rows per page selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm text-gray-600">Rows per page:</span>
                  <select
                    value={rowsPerPage}
                    onChange={handleRowsPerPageChange}
                    className="border border-sky-300 rounded-md px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value="all">All</option>
                  </select>
                </div>
                
                {/* Page information */}
                <div className="text-xs sm:text-sm text-gray-600">
                  Showing {rowsPerPage === 'all' ? filteredContacts.length : Math.min((currentPage - 1) * rowsPerPage + 1, filteredContacts.length)} to{' '}
                  {rowsPerPage === 'all' 
                    ? filteredContacts.length 
                    : Math.min(currentPage * rowsPerPage, filteredContacts.length)} of {filteredContacts.length} entries
                </div>
                
                {/* Pagination buttons */}
                {rowsPerPage !== 'all' && totalPages > 1 && (
                  <div className="flex items-center gap-1 flex-wrap justify-center">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className={`px-2 py-1 sm:px-3 sm:py-1 rounded-md text-xs sm:text-sm transition-colors ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white border border-sky-300 text-sky-700 hover:bg-sky-100'
                      }`}
                    >
                      First
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-2 py-1 sm:px-3 sm:py-1 rounded-md text-xs sm:text-sm transition-colors ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white border border-sky-300 text-sky-700 hover:bg-sky-100'
                      }`}
                    >
                      Prev
                    </button>
                    
                    {getPageNumbers().map(page => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-2 py-1 sm:px-3 sm:py-1 rounded-md text-xs sm:text-sm transition-colors ${
                          currentPage === page
                            ? 'bg-sky-600 text-white'
                            : 'bg-white border border-sky-300 text-sky-700 hover:bg-sky-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-2 py-1 sm:px-3 sm:py-1 rounded-md text-xs sm:text-sm transition-colors ${
                        currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white border border-sky-300 text-sky-700 hover:bg-sky-100'
                      }`}
                    >
                      Next
                    </button>
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className={`px-2 py-1 sm:px-3 sm:py-1 rounded-md text-xs sm:text-sm transition-colors ${
                        currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white border border-sky-300 text-sky-700 hover:bg-sky-100'
                      }`}
                    >
                      Last
                    </button>
                  </div>
                )}
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );

  // Email Dialog Component
  const EmailDialog = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-fade-in">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-sky-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Send Email</h3>
                <p className="text-sm text-gray-500">To: {emailDialog.name}</p>
              </div>
            </div>
            <button
              onClick={() => setEmailDialog({ open: false, email: '', name: '' })}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="bg-sky-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Email Address:</p>
              <p className="text-sm font-mono text-sky-700 break-all">{emailDialog.email}</p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  window.location.href = `mailto:${emailDialog.email}`;
                  setEmailDialog({ open: false, email: '', name: '' });
                }}
                className="flex-1 bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors"
              >
                Open Email App
              </button>
              <button
                onClick={() => copyToClipboard(emailDialog.email, 'Email')}
                className="flex-1 border border-sky-300 text-sky-700 px-4 py-2 rounded-lg hover:bg-sky-50 transition-colors"
              >
                Copy Email
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Phone Dialog Component
  const PhoneDialog = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-fade-in">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Call Contact</h3>
                <p className="text-sm text-gray-500">{phoneDialog.name}</p>
              </div>
            </div>
            <button
              onClick={() => setPhoneDialog({ open: false, phone: '', name: '' })}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Phone Number:</p>
              <p className="text-lg font-mono text-green-700">{phoneDialog.phone}</p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  window.location.href = `tel:${phoneDialog.phone}`;
                  setPhoneDialog({ open: false, phone: '', name: '' });
                }}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Call Now
              </button>
              <button
                onClick={() => copyToClipboard(phoneDialog.phone, 'Phone number')}
                className="flex-1 border border-green-300 text-green-700 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors"
              >
                Copy Number
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
          <div className="text-lg text-gray-600">Loading contact requests...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500 bg-red-50 px-6 py-3 rounded-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Contact Requests</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage and respond to customer inquiries</p>
        </div>
        <button
          onClick={fetchContactData}
          className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-sky-300 rounded-md text-sm font-medium text-sky-700 bg-white hover:bg-sky-50 transition-colors duration-200"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow-md border border-sky-200 p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Date Range Filter</h2>
          </div>
          <div className="text-xs sm:text-sm text-gray-500">
            Total: {filteredContacts.length} request{filteredContacts.length !== 1 ? 's' : ''}
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
              className="inline-flex items-center justify-center px-4 py-2 border border-sky-300 rounded-md text-sm font-medium text-sky-700 bg-white hover:bg-sky-50 transition-colors duration-200 w-full"
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
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg shadow-md border border-sky-100">
          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <div className="text-gray-500 text-lg font-medium">No contact requests found</div>
          <div className="text-gray-400 text-sm mt-1">New requests will appear here</div>
        </div>
      ) : (
        <TableView />
      )}

      {/* Email Dialog */}
      {emailDialog.open && <EmailDialog />}
      
      {/* Phone Dialog */}
      {phoneDialog.open && <PhoneDialog />}

      {/* Snackbar Notification */}
      {snack.open && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className={`rounded-lg shadow-2xl border p-4 min-w-[280px] transform transition-all duration-300 ${
            snack.tone === 'success' ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200' :
            snack.tone === 'danger' ? 'bg-gradient-to-r from-rose-50 to-rose-100 border-rose-200' :
            'bg-gradient-to-r from-sky-50 to-sky-100 border-sky-200'
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {snack.tone === 'success' ? (
                  <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : snack.tone === 'danger' ? (
                  <svg className="h-5 w-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="ml-3 flex-1">
                <div className={`font-semibold text-sm ${
                  snack.tone === 'success' ? 'text-emerald-900' :
                  snack.tone === 'danger' ? 'text-rose-900' :
                  'text-sky-900'
                }`}>
                  {snack.title}
                </div>
                <div className={`mt-1 text-sm ${
                  snack.tone === 'success' ? 'text-emerald-700' :
                  snack.tone === 'danger' ? 'text-rose-700' :
                  'text-sky-700'
                }`}>
                  {snack.message}
                </div>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={() => setSnack({ open: false, tone: 'success', title: '', message: '' })}
                  className="inline-flex rounded-md p-1 hover:bg-opacity-20 hover:bg-gray-500"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default RequestPage;