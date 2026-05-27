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
  
// //   // Pagination states
// //   const [currentPage, setCurrentPage] = useState(1);
// //   const [rowsPerPage, setRowsPerPage] = useState(10);

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
// //       end.setHours(23, 59, 59, 999);
      
// //       return contactDate >= start && contactDate <= end;
// //     });
    
// //     setFilteredContacts(filtered);
// //     setCurrentPage(1);
// //   };

// //   const clearFilters = () => {
// //     setStartDate('');
// //     setEndDate('');
// //     setCurrentPage(1);
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

// //   // Get current page data
// //   const getCurrentPageData = () => {
// //     if (rowsPerPage === 'all') {
// //       return filteredContacts;
// //     }
// //     const startIndex = (currentPage - 1) * rowsPerPage;
// //     const endIndex = startIndex + rowsPerPage;
// //     return filteredContacts.slice(startIndex, endIndex);
// //   };

// //   // Handle rows per page change
// //   const handleRowsPerPageChange = (e) => {
// //     const value = e.target.value;
// //     setRowsPerPage(value === 'all' ? 'all' : parseInt(value));
// //     setCurrentPage(1);
// //   };

// //   // Handle page change
// //   const handlePageChange = (page) => {
// //     setCurrentPage(page);
// //   };

// //   // Calculate total pages
// //   const totalPages = rowsPerPage === 'all' ? 1 : Math.ceil(filteredContacts.length / rowsPerPage);
  
// //   // Generate page numbers
// //   const getPageNumbers = () => {
// //     const pages = [];
// //     const maxVisible = 5;
// //     let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
// //     let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
// //     if (endPage - startPage + 1 < maxVisible) {
// //       startPage = Math.max(1, endPage - maxVisible + 1);
// //     }
    
// //     for (let i = startPage; i <= endPage; i++) {
// //       pages.push(i);
// //     }
    
// //     return pages;
// //   };

// //   const currentData = getCurrentPageData();

// //   const TableView = () => (
// //     <div className="overflow-x-auto rounded-xl shadow-lg border border-amber-200">
// //       <table className="min-w-full bg-white">
// //         <thead className="bg-gradient-to-r from-amber-900 to-amber-900">
// //           <tr>
// //             <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
// //               <div className="flex items-center">
// //                 <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
// //                 </svg>
// //                 ID
// //               </div>
// //             </th>
// //             <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
// //               <div className="flex items-center">
// //                 <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
// //                 </svg>
// //                 Full Name
// //               </div>
// //             </th>
// //             <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
// //               <div className="flex items-center">
// //                 <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
// //                 </svg>
// //                 Mobile
// //               </div>
// //             </th>
// //             <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
// //               <div className="flex items-center">
// //                 <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
// //                 </svg>
// //                 Email
// //               </div>
// //             </th>
// //             <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider hidden md:table-cell">
// //               <div className="flex items-center">
// //                 <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
// //                 </svg>
// //                 Description
// //               </div>
// //             </th>
// //             <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
// //               <div className="flex items-center">
// //                 <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
// //                 </svg>
// //                 Date
// //               </div>
// //             </th>
// //           </tr>
// //         </thead>
// //         <tbody className="bg-white divide-y divide-gray-100">
// //           {currentData.map((contact) => (
// //             <tr key={contact.id} className="hover:bg-gradient-to-r hover:from-amber-50 hover:to-amber-50 transition-all duration-200">
// //               <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
// //                 <span className="inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-800">
// //                   {contact.id}
// //                 </span>
// //               </td>
// //               <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
// //                 <div className="flex items-center">
// //                   <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
// //                     <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-r from-sky-500 to-sky-600 flex items-center justify-center">
// //                       <span className="text-white font-bold text-xs sm:text-sm">{contact.full_name?.charAt(0).toUpperCase() || '?'}</span>
// //                     </div>
// //                   </div>
// //                   <div className="ml-2 sm:ml-4">
// //                     <div className="text-xs sm:text-sm font-bold text-gray-900">{contact.full_name}</div>
// //                   </div>
// //                 </div>
// //               </td>
// //               <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
// //                 <div className="flex items-center text-xs sm:text-sm text-gray-700">
// //                   <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
// //                   </svg>
// //                   <span className="truncate max-w-[100px] sm:max-w-none">{contact.mobile_number}</span>
// //                 </div>
// //               </td>
// //               <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
// //                 <div className="flex items-center text-xs sm:text-sm text-gray-700">
// //                   <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
// //                   </svg>
// //                   <span className="truncate max-w-[120px] sm:max-w-[200px]">{contact.email_address}</span>
// //                 </div>
// //               </td>
// //               <td className="px-4 py-3 sm:px-6 sm:py-4 hidden md:table-cell">
// //                 <div className="text-xs sm:text-sm text-gray-700 max-w-xs">
// //                   <div className="whitespace-normal break-words line-clamp-2">{contact.description || '—'}</div>
// //                 </div>
// //               </td>
// //               <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
// //                 <div className="flex items-center text-xs sm:text-sm text-gray-700">
// //                   <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
// //                   </svg>
// //                   {formatDate(contact.created_at)}
// //                 </div>
// //               </td>
// //             </tr>
// //           ))}
// //         </tbody>
// //         {/* Pagination inside table footer */}
// //         <tfoot className="bg-sky-50 border-t border-sky-200">
// //           <tr>
// //             <td colSpan="6" className="px-4 py-3 sm:px-6 sm:py-4">
// //               <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
// //                 {/* Rows per page selector */}
// //                 <div className="flex items-center gap-2">
// //                   <span className="text-xs sm:text-sm text-gray-600">Rows per page:</span>
// //                   <select
// //                     value={rowsPerPage}
// //                     onChange={handleRowsPerPageChange}
// //                     className="border border-sky-300 rounded-md px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white"
// //                   >
// //                     <option value={10}>10</option>
// //                     <option value={20}>20</option>
// //                     <option value={50}>50</option>
// //                     <option value="all">All</option>
// //                   </select>
// //                 </div>
                
// //                 {/* Page information */}
// //                 <div className="text-xs sm:text-sm text-gray-600">
// //                   Showing {rowsPerPage === 'all' ? filteredContacts.length : Math.min((currentPage - 1) * rowsPerPage + 1, filteredContacts.length)} to{' '}
// //                   {rowsPerPage === 'all' 
// //                     ? filteredContacts.length 
// //                     : Math.min(currentPage * rowsPerPage, filteredContacts.length)} of {filteredContacts.length} entries
// //                 </div>
                
// //                 {/* Pagination buttons */}
// //                 {rowsPerPage !== 'all' && totalPages > 1 && (
// //                   <div className="flex items-center gap-1 flex-wrap justify-center">
// //                     <button
// //                       onClick={() => handlePageChange(1)}
// //                       disabled={currentPage === 1}
// //                       className={`px-2 py-1 sm:px-3 sm:py-1 rounded-md text-xs sm:text-sm transition-colors ${
// //                         currentPage === 1
// //                           ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
// //                           : 'bg-white border border-sky-300 text-sky-700 hover:bg-sky-100'
// //                       }`}
// //                     >
// //                       First
// //                     </button>
// //                     <button
// //                       onClick={() => handlePageChange(currentPage - 1)}
// //                       disabled={currentPage === 1}
// //                       className={`px-2 py-1 sm:px-3 sm:py-1 rounded-md text-xs sm:text-sm transition-colors ${
// //                         currentPage === 1
// //                           ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
// //                           : 'bg-white border border-sky-300 text-sky-700 hover:bg-sky-100'
// //                       }`}
// //                     >
// //                       Prev
// //                     </button>
                    
// //                     {getPageNumbers().map(page => (
// //                       <button
// //                         key={page}
// //                         onClick={() => handlePageChange(page)}
// //                         className={`px-2 py-1 sm:px-3 sm:py-1 rounded-md text-xs sm:text-sm transition-colors ${
// //                           currentPage === page
// //                             ? 'bg-sky-600 text-white'
// //                             : 'bg-white border border-sky-300 text-sky-700 hover:bg-sky-100'
// //                         }`}
// //                       >
// //                         {page}
// //                       </button>
// //                     ))}
                    
// //                     <button
// //                       onClick={() => handlePageChange(currentPage + 1)}
// //                       disabled={currentPage === totalPages}
// //                       className={`px-2 py-1 sm:px-3 sm:py-1 rounded-md text-xs sm:text-sm transition-colors ${
// //                         currentPage === totalPages
// //                           ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
// //                           : 'bg-white border border-sky-300 text-sky-700 hover:bg-sky-100'
// //                       }`}
// //                     >
// //                       Next
// //                     </button>
// //                     <button
// //                       onClick={() => handlePageChange(totalPages)}
// //                       disabled={currentPage === totalPages}
// //                       className={`px-2 py-1 sm:px-3 sm:py-1 rounded-md text-xs sm:text-sm transition-colors ${
// //                         currentPage === totalPages
// //                           ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
// //                           : 'bg-white border border-sky-300 text-sky-700 hover:bg-sky-100'
// //                       }`}
// //                     >
// //                       Last
// //                     </button>
// //                   </div>
// //                 )}
// //               </div>
// //             </td>
// //           </tr>
// //         </tfoot>
// //       </table>
// //     </div>
// //   );

// //   if (loading) {
// //     return (
// //       <div className="flex justify-center items-center h-64">
// //         <div className="flex flex-col items-center gap-3">
// //           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
// //           <div className="text-lg text-gray-600">Loading contact requests...</div>
// //         </div>
// //       </div>
// //     );
// //   }

// //   if (error) {
// //     return (
// //       <div className="flex justify-center items-center h-64">
// //         <div className="text-red-500 bg-red-50 px-6 py-3 rounded-lg">{error}</div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="p-4 sm:p-6">
// //       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
// //         <div>
// //           <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Contact Requests</h1>
// //           <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage and respond to customer inquiries</p>
// //         </div>
// //         <button
// //           onClick={fetchContactData}
// //           className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-amber-300 rounded-md text-sm font-medium text-amber-700 bg-white hover:bg-amber-50 transition-colors duration-200"
// //         >
// //           <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
// //           </svg>
// //           Refresh
// //         </button>
// //       </div>

// //       {/* Date Range Filter */}
// //       <div className="bg-white rounded-lg shadow-md border border-amber-200 p-4 sm:p-6 mb-6">
// //         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
// //           <div className="flex items-center space-x-2">
// //             <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
// //             </svg>
// //             <h2 className="text-base sm:text-lg font-semibold text-gray-900">Date Range Filter</h2>
// //           </div>
// //           <div className="text-xs sm:text-sm text-gray-500">
// //             Total: {filteredContacts.length} request{filteredContacts.length !== 1 ? 's' : ''}
// //           </div>
// //         </div>
        
// //         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
// //           <div>
// //             <label className="block text-sm font-medium text-gray-700 mb-2">
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
// //             <label className="block text-sm font-medium text-gray-700 mb-2">
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
// //               className="inline-flex items-center justify-center px-4 py-2 border border-amber-300 rounded-md text-sm font-medium text-amber-700 bg-white hover:bg-amber-50 transition-colors duration-200 w-full"
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
// //         <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg shadow-md border border-sky-100">
// //           <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
// //           </svg>
// //           <div className="text-gray-500 text-lg font-medium">No contact requests found</div>
// //           <div className="text-gray-400 text-sm mt-1">New requests will appear here</div>
// //         </div>
// //       ) : (
// //         <TableView />
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
  
//   // Track expanded descriptions
//   const [expandedDescriptions, setExpandedDescriptions] = useState({});

//   useEffect(() => {
//     fetchContactData();
//   }, []);

//   useEffect(() => {
//     applyDateFilter();
//   }, [contacts, startDate, endDate]);

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
//     setCurrentPage(1);
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

//   // Toggle description expansion
//   const toggleDescription = (id) => {
//     setExpandedDescriptions(prev => ({
//       ...prev,
//       [id]: !prev[id]
//     }));
//   };

//   // Truncate text to specified length
//   const truncateText = (text, maxLength = 100) => {
//     if (!text || text === '—') return { isLong: false, truncated: text || '—', full: text || '—' };
//     if (text.length <= maxLength) return { isLong: false, truncated: text, full: text };
//     return {
//       isLong: true,
//       truncated: text.substring(0, maxLength) + '...',
//       full: text
//     };
//   };

//   // Get current page data
//   const getCurrentPageData = () => {
//     if (rowsPerPage === 'all') {
//       return filteredContacts;
//     }
//     const startIndex = (currentPage - 1) * rowsPerPage;
//     const endIndex = startIndex + rowsPerPage;
//     return filteredContacts.slice(startIndex, endIndex);
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

//   const currentData = getCurrentPageData();

//   // Description Cell Component with Read More/Less
//   const DescriptionCell = ({ description, id }) => {
//     const { isLong, truncated, full } = truncateText(description, 100);
//     const isExpanded = expandedDescriptions[id];
    
//     if (!description || description === '—') {
//       return <div className="text-xs sm:text-sm text-gray-500 italic">—</div>;
//     }
    
//     return (
//       <div className="text-xs sm:text-sm text-gray-700">
//         <div className="whitespace-normal break-words">
//           {isExpanded ? full : truncated}
//         </div>
//         {isLong && (
//           <button
//             onClick={() => toggleDescription(id)}
//             className="mt-1 text-xs text-amber-600 hover:text-amber-800 font-medium transition-colors"
//           >
//             {isExpanded ? 'Read less ↑' : 'Read more ↓'}
//           </button>
//         )}
//       </div>
//     );
//   };

//   const TableView = () => (
//     <div className="overflow-x-auto rounded-xl shadow-lg border border-amber-200">
//       <table className="min-w-full bg-white">
//         <thead className="bg-gradient-to-r from-amber-800 to-amber-900">
//           <tr>
//             <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
//               <div className="flex items-center">
//                 <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
//                 </svg>
//                 ID
//               </div>
//             </th>
//             <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
//               <div className="flex items-center">
//                 <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
//                 </svg>
//                 Full Name
//               </div>
//             </th>
//             <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
//               <div className="flex items-center">
//                 <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
//                 </svg>
//                 Mobile
//               </div>
//             </th>
//             <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
//               <div className="flex items-center">
//                 <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
//                 </svg>
//                 Email
//               </div>
//             </th>
//             <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider min-w-[200px] md:min-w-[250px]">
//               <div className="flex items-center">
//                 <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
//                 </svg>
//                 Description
//               </div>
//             </th>
//             <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
//               <div className="flex items-center">
//                 <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                 </svg>
//                 Date
//               </div>
//             </th>
//           </tr>
//         </thead>
//         <tbody className="bg-white divide-y divide-gray-100">
//           {currentData.map((contact) => (
//             <tr key={contact.id} className="hover:bg-gradient-to-r hover:from-amber-50 hover:to-amber-50 transition-all duration-200">
//               <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
//                 <span className="inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
//                   {contact.id}
//                 </span>
//               </td>
//               <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
//                 <div className="flex items-center">
//                   <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
//                     <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 flex items-center justify-center">
//                       <span className="text-white font-bold text-xs sm:text-sm">{contact.full_name?.charAt(0).toUpperCase() || '?'}</span>
//                     </div>
//                   </div>
//                   <div className="ml-2 sm:ml-4">
//                     <div className="text-xs sm:text-sm font-bold text-gray-900">{contact.full_name}</div>
//                   </div>
//                 </div>
//               </td>
//               <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
//                 <a
//                   href={`tel:${contact.mobile_number}`}
//                   className="flex items-center text-xs sm:text-sm text-gray-700 hover:text-green-600 transition-colors group"
//                   title="Click to call"
//                 >
//                   <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-amber-400 group-hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
//                   </svg>
//                   <span className="group-hover:text-green-600 truncate max-w-[100px] sm:max-w-none">{contact.mobile_number}</span>
//                 </a>
//               </td>
//               <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
//                 <a
//                   href={`mailto:${contact.email_address}?subject=Inquiry from ${encodeURIComponent(contact.full_name)}`}
//                   className="flex items-center text-xs sm:text-sm text-gray-700 hover:text-blue-600 transition-colors group"
//                   title="Click to send email"
//                 >
//                   <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-amber-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
//                   </svg>
//                   <span className="group-hover:text-blue-600 truncate max-w-[120px] sm:max-w-[200px]">{contact.email_address}</span>
//                 </a>
//               </td>
//               <td className="px-4 py-3 sm:px-6 sm:py-4">
//                 <DescriptionCell description={contact.description} id={contact.id} />
//               </td>
//               <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
//                 <div className="flex items-center text-xs sm:text-sm text-gray-700">
//                   <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                   </svg>
//                   {formatDate(contact.created_at)}
//                 </div>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//         <tfoot className="bg-amber-50 border-t border-amber-200">
//           <tr>
//             <td colSpan="6" className="px-4 py-3 sm:px-6 sm:py-4">
//               <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
//                 <div className="flex items-center gap-2">
//                   <span className="text-xs sm:text-sm text-gray-600">Rows per page:</span>
//                   <select
//                     value={rowsPerPage}
//                     onChange={handleRowsPerPageChange}
//                     className="border border-amber-300 rounded-md px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
//                   >
//                     <option value={10}>10</option>
//                     <option value={20}>20</option>
//                     <option value={50}>50</option>
//                     <option value="all">All</option>
//                   </select>
//                 </div>
                
//                 <div className="text-xs sm:text-sm text-gray-600">
//                   Showing {rowsPerPage === 'all' ? filteredContacts.length : Math.min((currentPage - 1) * rowsPerPage + 1, filteredContacts.length)} to{' '}
//                   {rowsPerPage === 'all' 
//                     ? filteredContacts.length 
//                     : Math.min(currentPage * rowsPerPage, filteredContacts.length)} of {filteredContacts.length} entries
//                 </div>
                
//                 {rowsPerPage !== 'all' && totalPages > 1 && (
//                   <div className="flex items-center gap-1 flex-wrap justify-center">
//                     <button
//                       onClick={() => handlePageChange(1)}
//                       disabled={currentPage === 1}
//                       className={`px-2 py-1 sm:px-3 sm:py-1 rounded-md text-xs sm:text-sm transition-colors ${
//                         currentPage === 1
//                           ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
//                           : 'bg-white border border-amber-300 text-amber-700 hover:bg-amber-50'
//                       }`}
//                     >
//                       First
//                     </button>
//                     <button
//                       onClick={() => handlePageChange(currentPage - 1)}
//                       disabled={currentPage === 1}
//                       className={`px-2 py-1 sm:px-3 sm:py-1 rounded-md text-xs sm:text-sm transition-colors ${
//                         currentPage === 1
//                           ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
//                           : 'bg-white border border-amber-300 text-amber-700 hover:bg-amber-50'
//                       }`}
//                     >
//                       Prev
//                     </button>
                    
//                     {getPageNumbers().map(page => (
//                       <button
//                         key={page}
//                         onClick={() => handlePageChange(page)}
//                         className={`px-2 py-1 sm:px-3 sm:py-1 rounded-md text-xs sm:text-sm transition-colors ${
//                           currentPage === page
//                             ? 'bg-amber-600 text-white'
//                             : 'bg-white border border-amber-300 text-amber-700 hover:bg-amber-50'
//                         }`}
//                       >
//                         {page}
//                       </button>
//                     ))}
                    
//                     <button
//                       onClick={() => handlePageChange(currentPage + 1)}
//                       disabled={currentPage === totalPages}
//                       className={`px-2 py-1 sm:px-3 sm:py-1 rounded-md text-xs sm:text-sm transition-colors ${
//                         currentPage === totalPages
//                           ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
//                           : 'bg-white border border-amber-300 text-amber-700 hover:bg-amber-50'
//                       }`}
//                     >
//                       Next
//                     </button>
//                     <button
//                       onClick={() => handlePageChange(totalPages)}
//                       disabled={currentPage === totalPages}
//                       className={`px-2 py-1 sm:px-3 sm:py-1 rounded-md text-xs sm:text-sm transition-colors ${
//                         currentPage === totalPages
//                           ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
//                           : 'bg-white border border-amber-300 text-amber-700 hover:bg-amber-50'
//                       }`}
//                     >
//                       Last
//                     </button>
//                   </div>
//                 )}
//               </div>
//             </td>
//           </tr>
//         </tfoot>
//       </table>
//     </div>
//   );

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="flex flex-col items-center gap-3">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
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
//     <div className="p-4 sm:p-6">
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
//         <div>
//           <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Contact Requests</h1>
//           <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage and respond to customer inquiries</p>
//         </div>
//         <button
//           onClick={fetchContactData}
//           className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-amber-300 rounded-md text-sm font-medium text-amber-700 bg-white hover:bg-amber-50 transition-colors duration-200"
//         >
//           <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//           </svg>
//           Refresh
//         </button>
//       </div>

//       <div className="bg-white rounded-lg shadow-md border border-amber-200 p-4 sm:p-6 mb-6">
//         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
//           <div className="flex items-center space-x-2">
//             <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//             </svg>
//             <h2 className="text-base sm:text-lg font-semibold text-gray-900">Date Range Filter</h2>
//           </div>
//           <div className="text-xs sm:text-sm text-gray-500">
//             Total: {filteredContacts.length} request{filteredContacts.length !== 1 ? 's' : ''}
//           </div>
//         </div>
        
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
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
//             <label className="block text-sm font-medium text-gray-700 mb-2">
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
//               className="inline-flex items-center justify-center px-4 py-2 border border-amber-300 rounded-md text-sm font-medium text-amber-700 bg-white hover:bg-amber-50 transition-colors duration-200 w-full"
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
//         <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg shadow-md border border-amber-100">
//           <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
//           </svg>
//           <div className="text-gray-500 text-lg font-medium">No contact requests found</div>
//           <div className="text-gray-400 text-sm mt-1">New requests will appear here</div>
//         </div>
//       ) : (
//         <TableView />
//       )}
//     </div>
//   );
// };

// export default RequestPage;







// import React, { useState, useEffect } from 'react';
// import { getContactData ,getCallbacks} from '../../api/contactus';
// import { CustomDatePicker } from '../ui/CustomDatePicker';

// const RequestPage = () => {
//   // Contact Requests states
//   const [contacts, setContacts] = useState([]);
//   const [filteredContacts, setFilteredContacts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [startDate, setStartDate] = useState('');
//   const [endDate, setEndDate] = useState('');
  
//   // Customer Call Requests states
//   const [callRequests, setCallRequests] = useState([]);
//   const [filteredCallRequests, setFilteredCallRequests] = useState([]);
//   const [callStartDate, setCallStartDate] = useState('');
//   const [callEndDate, setCallEndDate] = useState('');
//   const [loadingCallRequests, setLoadingCallRequests] = useState(true);
//   const [callError, setCallError] = useState(null);
  
//   // Pagination states for Contact Requests
//   const [currentPage, setCurrentPage] = useState(1);
//   const [rowsPerPage, setRowsPerPage] = useState(10);
  
//   // Pagination states for Call Requests
//   const [currentPageCall, setCurrentPageCall] = useState(1);
//   const [rowsPerPageCall, setRowsPerPageCall] = useState(10);
  
//   // Track expanded descriptions for Contact Requests
//   const [expandedDescriptions, setExpandedDescriptions] = useState({});
  
//   // Track expanded reasons for Call Requests
//   const [expandedReasons, setExpandedReasons] = useState({});

//   // Fetch both data sets on mount
//   useEffect(() => {
//     fetchContactData();
//     fetchCallRequestsData();
//   }, []);

//   // Apply date filters
//   useEffect(() => {
//     applyDateFilter();
//   }, [contacts, startDate, endDate]);

//   useEffect(() => {
//     applyCallDateFilter();
//   }, [callRequests, callStartDate, callEndDate]);

//   // Contact Requests date filter
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
//     setCurrentPage(1);
//   };

//   // Call Requests date filter
//   const applyCallDateFilter = () => {
//     if (!callStartDate || !callEndDate) {
//       setFilteredCallRequests(callRequests);
//       return;
//     }

//     const filtered = callRequests.filter(request => {
//       const requestDate = new Date(request.created_at);
//       const start = new Date(callStartDate);
//       const end = new Date(callEndDate);
//       end.setHours(23, 59, 59, 999);
      
//       return requestDate >= start && requestDate <= end;
//     });
    
//     setFilteredCallRequests(filtered);
//     setCurrentPageCall(1);
//   };

//   // Clear filters for Contact Requests
//   const clearFilters = () => {
//     setStartDate('');
//     setEndDate('');
//     setCurrentPage(1);
//   };

//   // Clear filters for Call Requests
//   const clearCallFilters = () => {
//     setCallStartDate('');
//     setCallEndDate('');
//     setCurrentPageCall(1);
//   };

//   // Fetch Contact Data
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

//   // Fetch Customer Call Requests Data
//   const fetchCallRequestsData = async () => {
//     try {
//       setLoadingCallRequests(true);
//       const response = await getCallbacks();
//       const items = response.items || [];
//       const sortedItems = [...items].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
//       setCallRequests(sortedItems);
//       setCallError(null);
//     } catch (err) {
//       setCallError('Failed to fetch call requests');
//       console.error('Error fetching call requests:', err);
//     } finally {
//       setLoadingCallRequests(false);
//     }
//   };

//   // Format date to dd/mm/yyyy
//   const formatDate = (dateString) => {
//     const date = new Date(dateString);
//     const day = String(date.getDate()).padStart(2, '0');
//     const month = String(date.getMonth() + 1).padStart(2, '0');
//     const year = date.getFullYear();
//     return `${day}/${month}/${year}`;
//   };

//   // Toggle description expansion for Contact Requests
//   const toggleDescription = (id) => {
//     setExpandedDescriptions(prev => ({
//       ...prev,
//       [id]: !prev[id]
//     }));
//   };

//   // Toggle reason expansion for Call Requests
//   const toggleReason = (id) => {
//     setExpandedReasons(prev => ({
//       ...prev,
//       [id]: !prev[id]
//     }));
//   };

//   // Truncate text
//   const truncateText = (text, maxLength = 100) => {
//     if (!text || text === '—') return { isLong: false, truncated: text || '—', full: text || '—' };
//     if (text.length <= maxLength) return { isLong: false, truncated: text, full: text };
//     return {
//       isLong: true,
//       truncated: text.substring(0, maxLength) + '...',
//       full: text
//     };
//   };

//   // Get status badge color
//   const getStatusBadge = (status) => {
//     const statusColors = {
//       pending: 'bg-yellow-100 text-yellow-800',
//       completed: 'bg-green-100 text-green-800',
//       cancelled: 'bg-red-100 text-red-800'
//     };
//     return statusColors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
//   };

//   // Pagination for Contact Requests
//   const getCurrentPageData = () => {
//     if (rowsPerPage === 'all') {
//       return filteredContacts;
//     }
//     const startIndex = (currentPage - 1) * rowsPerPage;
//     const endIndex = startIndex + rowsPerPage;
//     return filteredContacts.slice(startIndex, endIndex);
//   };

//   // Pagination for Call Requests
//   const getCurrentPageCallData = () => {
//     if (rowsPerPageCall === 'all') {
//       return filteredCallRequests;
//     }
//     const startIndex = (currentPageCall - 1) * rowsPerPageCall;
//     const endIndex = startIndex + rowsPerPageCall;
//     return filteredCallRequests.slice(startIndex, endIndex);
//   };

//   const handleRowsPerPageChange = (e) => {
//     const value = e.target.value;
//     setRowsPerPage(value === 'all' ? 'all' : parseInt(value));
//     setCurrentPage(1);
//   };

//   const handleRowsPerPageCallChange = (e) => {
//     const value = e.target.value;
//     setRowsPerPageCall(value === 'all' ? 'all' : parseInt(value));
//     setCurrentPageCall(1);
//   };

//   const handlePageChange = (page) => {
//     setCurrentPage(page);
//   };

//   const handlePageChangeCall = (page) => {
//     setCurrentPageCall(page);
//   };

//   const totalPages = rowsPerPage === 'all' ? 1 : Math.ceil(filteredContacts.length / rowsPerPage);
//   const totalPagesCall = rowsPerPageCall === 'all' ? 1 : Math.ceil(filteredCallRequests.length / rowsPerPageCall);

//   const getPageNumbers = (current, total) => {
//     const pages = [];
//     const maxVisible = 5;
//     let startPage = Math.max(1, current - Math.floor(maxVisible / 2));
//     let endPage = Math.min(total, startPage + maxVisible - 1);
    
//     if (endPage - startPage + 1 < maxVisible) {
//       startPage = Math.max(1, endPage - maxVisible + 1);
//     }
    
//     for (let i = startPage; i <= endPage; i++) {
//       pages.push(i);
//     }
    
//     return pages;
//   };

//   const currentData = getCurrentPageData();
//   const currentCallData = getCurrentPageCallData();

//   // Description Cell Component for Contact Requests
//   const DescriptionCell = ({ description, id }) => {
//     const { isLong, truncated, full } = truncateText(description, 100);
//     const isExpanded = expandedDescriptions[id];
    
//     if (!description || description === '—') {
//       return <div className="text-xs sm:text-sm text-gray-500 italic">—</div>;
//     }
    
//     return (
//       <div className="text-xs sm:text-sm text-gray-700">
//         <div className="whitespace-normal break-words">
//           {isExpanded ? full : truncated}
//         </div>
//         {isLong && (
//           <button
//             onClick={() => toggleDescription(id)}
//             className="mt-1 text-xs text-amber-600 hover:text-amber-800 font-medium transition-colors"
//           >
//             {isExpanded ? 'Read less ↑' : 'Read more ↓'}
//           </button>
//         )}
//       </div>
//     );
//   };

//   // Reason Cell Component for Call Requests
//   const ReasonCell = ({ reason, id }) => {
//     const { isLong, truncated, full } = truncateText(reason, 80);
//     const isExpanded = expandedReasons[id];
    
//     if (!reason || reason === '—') {
//       return <div className="text-xs sm:text-sm text-gray-500 italic">—</div>;
//     }
    
//     return (
//       <div className="text-xs sm:text-sm text-gray-700">
//         <div className="whitespace-normal break-words">
//           {isExpanded ? full : truncated}
//         </div>
//         {isLong && (
//           <button
//             onClick={() => toggleReason(id)}
//             className="mt-1 text-xs text-amber-600 hover:text-amber-800 font-medium transition-colors"
//           >
//             {isExpanded ? 'Read less ↑' : 'Read more ↓'}
//           </button>
//         )}
//       </div>
//     );
//   };

//   // Contact Requests Table
//   const ContactTableView = () => (
//     <div className="overflow-x-auto rounded-xl shadow-lg border border-amber-200">
//       <table className="min-w-full bg-white">
//         <thead className="bg-gradient-to-r from-amber-800 to-amber-900">
//           <tr>
//             <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">ID</th>
//             <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Full Name</th>
//             <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Mobile</th>
//             <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Email</th>
//             <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider min-w-[200px]">Description</th>
//             <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Date</th>
//           </tr>
//         </thead>
//         <tbody className="bg-white divide-y divide-gray-100">
//           {currentData.map((contact) => (
//             <tr key={contact.id} className="hover:bg-amber-50 transition-all duration-200">
//               <td className="px-4 py-3 whitespace-nowrap">
//                 <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
//                   {contact.id}
//                 </span>
//               </td>
//               <td className="px-4 py-3 whitespace-nowrap">
//                 <div className="flex items-center">
//                   <div className="flex-shrink-0 h-8 w-8">
//                     <div className="h-8 w-8 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 flex items-center justify-center">
//                       <span className="text-white font-bold text-xs">{contact.full_name?.charAt(0).toUpperCase() || '?'}</span>
//                     </div>
//                   </div>
//                   <div className="ml-3">
//                     <div className="text-sm font-bold text-gray-900">{contact.full_name}</div>
//                   </div>
//                 </div>
//               </td>
//               <td className="px-4 py-3 whitespace-nowrap">
//                 <a href={`tel:${contact.mobile_number}`} className="flex items-center text-sm text-gray-700 hover:text-green-600 group">
//                   <svg className="w-4 h-4 mr-1 text-amber-400 group-hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
//                   </svg>
//                   {contact.mobile_number}
//                 </a>
//               </td>
//               <td className="px-4 py-3 whitespace-nowrap">
//                 <a href={`mailto:${contact.email_address}`} className="flex items-center text-sm text-gray-700 hover:text-blue-600 group">
//                   <svg className="w-4 h-4 mr-1 text-amber-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
//                   </svg>
//                   <span className="truncate max-w-[150px]">{contact.email_address}</span>
//                 </a>
//               </td>
//               <td className="px-4 py-3">
//                 <DescriptionCell description={contact.description} id={contact.id} />
//               </td>
//               <td className="px-4 py-3 whitespace-nowrap">
//                 <div className="flex items-center text-sm text-gray-700">
//                   <svg className="w-4 h-4 mr-1 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                   </svg>
//                   {formatDate(contact.created_at)}
//                 </div>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//         <tfoot className="bg-amber-50 border-t border-amber-200">
//           <tr>
//             <td colSpan="6" className="px-4 py-3">
//               <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
//                 <div className="flex items-center gap-2">
//                   <span className="text-sm text-gray-600">Rows per page:</span>
//                   <select
//                     value={rowsPerPage}
//                     onChange={handleRowsPerPageChange}
//                     className="border border-amber-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
//                   >
//                     <option value={10}>10</option>
//                     <option value={20}>20</option>
//                     <option value={50}>50</option>
//                     <option value="all">All</option>
//                   </select>
//                 </div>
                
//                 <div className="text-sm text-gray-600">
//                   Showing {rowsPerPage === 'all' ? filteredContacts.length : Math.min((currentPage - 1) * rowsPerPage + 1, filteredContacts.length)} to{' '}
//                   {rowsPerPage === 'all' ? filteredContacts.length : Math.min(currentPage * rowsPerPage, filteredContacts.length)} of {filteredContacts.length} entries
//                 </div>
                
//                 {rowsPerPage !== 'all' && totalPages > 1 && (
//                   <div className="flex items-center gap-1">
//                     <button onClick={() => handlePageChange(1)} disabled={currentPage === 1} className="px-2 py-1 rounded-md text-sm bg-white border border-amber-300 text-amber-700 hover:bg-amber-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed">First</button>
//                     <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-2 py-1 rounded-md text-sm bg-white border border-amber-300 text-amber-700 hover:bg-amber-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed">Prev</button>
//                     {getPageNumbers(currentPage, totalPages).map(page => (
//                       <button key={page} onClick={() => handlePageChange(page)} className={`px-2 py-1 rounded-md text-sm ${currentPage === page ? 'bg-amber-600 text-white' : 'bg-white border border-amber-300 text-amber-700 hover:bg-amber-50'}`}>{page}</button>
//                     ))}
//                     <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-2 py-1 rounded-md text-sm bg-white border border-amber-300 text-amber-700 hover:bg-amber-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed">Next</button>
//                     <button onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} className="px-2 py-1 rounded-md text-sm bg-white border border-amber-300 text-amber-700 hover:bg-amber-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed">Last</button>
//                   </div>
//                 )}
//               </div>
//             </td>
//           </tr>
//         </tfoot>
//       </table>
//     </div>
//   );

//   // Customer Call Requests Table
//   const CallRequestsTableView = () => (
//     <div className="overflow-x-auto rounded-xl shadow-lg border border-green-200">
//       <table className="min-w-full bg-white">
//         <thead className="bg-gradient-to-r from-green-800 to-green-900">
//           <tr>
//             <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Customer ID</th>
//             <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Customer Name</th>
//             <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Mobile</th>
//             <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Email</th>
//             <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider min-w-[200px]">Reason</th>
//             <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Status</th>
//             <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Date</th>
//           </tr>
//         </thead>
//         <tbody className="bg-white divide-y divide-gray-100">
//           {currentCallData.map((request) => (
//             <tr key={request.id} className="hover:bg-green-50 transition-all duration-200">
//               <td className="px-4 py-3 whitespace-nowrap">
//                 <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
//                   {request.customer_id}
//                 </span>
//               </td>
//               <td className="px-4 py-3 whitespace-nowrap">
//                 <div className="flex items-center">
//                   <div className="flex-shrink-0 h-8 w-8">
//                     <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-600 to-green-700 flex items-center justify-center">
//                       <span className="text-white font-bold text-xs">{request.customer_name?.charAt(0).toUpperCase() || '?'}</span>
//                     </div>
//                   </div>
//                   <div className="ml-3">
//                     <div className="text-sm font-bold text-gray-900">{request.customer_name}</div>
//                   </div>
//                 </div>
//               </td>
//               <td className="px-4 py-3 whitespace-nowrap">
//                 <a href={`tel:${request.customer_mobile}`} className="flex items-center text-sm text-gray-700 hover:text-green-600 group">
//                   <svg className="w-4 h-4 mr-1 text-green-400 group-hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
//                   </svg>
//                   {request.customer_mobile}
//                 </a>
//               </td>
//               <td className="px-4 py-3 whitespace-nowrap">
//                 <a href={`mailto:${request.customer_email}`} className="flex items-center text-sm text-gray-700 hover:text-blue-600 group">
//                   <svg className="w-4 h-4 mr-1 text-green-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
//                   </svg>
//                   <span className="truncate max-w-[150px]">{request.customer_email}</span>
//                 </a>
//               </td>
//               <td className="px-4 py-3">
//                 <ReasonCell reason={request.reason} id={request.id} />
//               </td>
//               <td className="px-4 py-3 whitespace-nowrap">
//                 <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(request.status)}`}>
//                   {request.status?.toUpperCase()}
//                 </span>
//               </td>
//               <td className="px-4 py-3 whitespace-nowrap">
//                 <div className="flex items-center text-sm text-gray-700">
//                   <svg className="w-4 h-4 mr-1 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                   </svg>
//                   {formatDate(request.created_at)}
//                 </div>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//         <tfoot className="bg-green-50 border-t border-green-200">
//           <tr>
//             <td colSpan="7" className="px-4 py-3">
//               <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
//                 <div className="flex items-center gap-2">
//                   <span className="text-sm text-gray-600">Rows per page:</span>
//                   <select
//                     value={rowsPerPageCall}
//                     onChange={handleRowsPerPageCallChange}
//                     className="border border-green-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
//                   >
//                     <option value={10}>10</option>
//                     <option value={20}>20</option>
//                     <option value={50}>50</option>
//                     <option value="all">All</option>
//                   </select>
//                 </div>
                
//                 <div className="text-sm text-gray-600">
//                   Showing {rowsPerPageCall === 'all' ? filteredCallRequests.length : Math.min((currentPageCall - 1) * rowsPerPageCall + 1, filteredCallRequests.length)} to{' '}
//                   {rowsPerPageCall === 'all' ? filteredCallRequests.length : Math.min(currentPageCall * rowsPerPageCall, filteredCallRequests.length)} of {filteredCallRequests.length} entries
//                 </div>
                
//                 {rowsPerPageCall !== 'all' && totalPagesCall > 1 && (
//                   <div className="flex items-center gap-1">
//                     <button onClick={() => handlePageChangeCall(1)} disabled={currentPageCall === 1} className="px-2 py-1 rounded-md text-sm bg-white border border-green-300 text-green-700 hover:bg-green-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed">First</button>
//                     <button onClick={() => handlePageChangeCall(currentPageCall - 1)} disabled={currentPageCall === 1} className="px-2 py-1 rounded-md text-sm bg-white border border-green-300 text-green-700 hover:bg-green-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed">Prev</button>
//                     {getPageNumbers(currentPageCall, totalPagesCall).map(page => (
//                       <button key={page} onClick={() => handlePageChangeCall(page)} className={`px-2 py-1 rounded-md text-sm ${currentPageCall === page ? 'bg-green-600 text-white' : 'bg-white border border-green-300 text-green-700 hover:bg-green-50'}`}>{page}</button>
//                     ))}
//                     <button onClick={() => handlePageChangeCall(currentPageCall + 1)} disabled={currentPageCall === totalPagesCall} className="px-2 py-1 rounded-md text-sm bg-white border border-green-300 text-green-700 hover:bg-green-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed">Next</button>
//                     <button onClick={() => handlePageChangeCall(totalPagesCall)} disabled={currentPageCall === totalPagesCall} className="px-2 py-1 rounded-md text-sm bg-white border border-green-300 text-green-700 hover:bg-green-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed">Last</button>
//                   </div>
//                 )}
//               </div>
//             </td>
//           </tr>
//         </tfoot>
//       </table>
//     </div>
//   );

//   if (loading && loadingCallRequests) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="flex flex-col items-center gap-3">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
//           <div className="text-lg text-gray-600">Loading data...</div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="p-4 sm:p-6 space-y-8">
//       {/* Customer Call Requests Section */}
//       <div>
//         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
//           <div>
//             <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Customer Call Requests</h1>
//             <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage customer callback requests</p>
//           </div>
//           <button
//             onClick={fetchCallRequestsData}
//             className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-white hover:bg-green-50 transition-colors duration-200"
//           >
//             <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//             </svg>
//             Refresh
//           </button>
//         </div>

//         {/* Date Range Filter for Call Requests */}
//         <div className="bg-white rounded-lg shadow-md border border-green-200 p-4 sm:p-6 mb-6">
//           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
//             <div className="flex items-center space-x-2">
//               <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//               </svg>
//               <h2 className="text-base sm:text-lg font-semibold text-gray-900">Date Range Filter</h2>
//             </div>
//             <div className="text-xs sm:text-sm text-gray-500">
//               Total: {filteredCallRequests.length} request{filteredCallRequests.length !== 1 ? 's' : ''}
//             </div>
//           </div>
          
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
//               <CustomDatePicker
//                 value={callStartDate}
//                 onChange={(value) => setCallStartDate(value)}
//                 placeholder="dd/mm/yyyy"
//                 className="w-full"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
//               <CustomDatePicker
//                 value={callEndDate}
//                 onChange={(value) => setCallEndDate(value)}
//                 placeholder="dd/mm/yyyy"
//                 className="w-full"
//               />
//             </div>
//             <div>
//               <button
//                 onClick={clearCallFilters}
//                 className="inline-flex items-center justify-center px-4 py-2 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-white hover:bg-green-50 transition-colors duration-200 w-full"
//               >
//                 <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//                 </svg>
//                 Clear Filters
//               </button>
//             </div>
//           </div>
//         </div>
        
//         {callError ? (
//           <div className="flex justify-center items-center py-12">
//             <div className="text-red-500 bg-red-50 px-6 py-3 rounded-lg">{callError}</div>
//           </div>
//         ) : loadingCallRequests ? (
//           <div className="flex justify-center items-center py-12">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
//           </div>
//         ) : filteredCallRequests.length === 0 ? (
//           <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg shadow-md border border-green-100">
//             <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
//             </svg>
//             <div className="text-gray-500 text-lg font-medium">No call requests found</div>
//             <div className="text-gray-400 text-sm mt-1">New requests will appear here</div>
//           </div>
//         ) : (
//           <CallRequestsTableView />
//         )}
//       </div>

//       {/* Contact Requests Section */}
//       <div>
//         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
//           <div>
//             <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Contact Requests</h1>
//             <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage and respond to customer inquiries</p>
//           </div>
//           <button
//             onClick={fetchContactData}
//             className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-amber-300 rounded-md text-sm font-medium text-amber-700 bg-white hover:bg-amber-50 transition-colors duration-200"
//           >
//             <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//             </svg>
//             Refresh
//           </button>
//         </div>

//         {/* Date Range Filter for Contact Requests */}
//         <div className="bg-white rounded-lg shadow-md border border-amber-200 p-4 sm:p-6 mb-6">
//           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
//             <div className="flex items-center space-x-2">
//               <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//               </svg>
//               <h2 className="text-base sm:text-lg font-semibold text-gray-900">Date Range Filter</h2>
//             </div>
//             <div className="text-xs sm:text-sm text-gray-500">
//               Total: {filteredContacts.length} request{filteredContacts.length !== 1 ? 's' : ''}
//             </div>
//           </div>
          
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
//               <CustomDatePicker
//                 value={startDate}
//                 onChange={(value) => setStartDate(value)}
//                 placeholder="dd/mm/yyyy"
//                 className="w-full"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
//               <CustomDatePicker
//                 value={endDate}
//                 onChange={(value) => setEndDate(value)}
//                 placeholder="dd/mm/yyyy"
//                 className="w-full"
//               />
//             </div>
//             <div>
//               <button
//                 onClick={clearFilters}
//                 className="inline-flex items-center justify-center px-4 py-2 border border-amber-300 rounded-md text-sm font-medium text-amber-700 bg-white hover:bg-amber-50 transition-colors duration-200 w-full"
//               >
//                 <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//                 </svg>
//                 Clear Filters
//               </button>
//             </div>
//           </div>
//         </div>
        
//         {error ? (
//           <div className="flex justify-center items-center py-12">
//             <div className="text-red-500 bg-red-50 px-6 py-3 rounded-lg">{error}</div>
//           </div>
//         ) : loading ? (
//           <div className="flex justify-center items-center py-12">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
//           </div>
//         ) : filteredContacts.length === 0 ? (
//           <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg shadow-md border border-amber-100">
//             <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
//             </svg>
//             <div className="text-gray-500 text-lg font-medium">No contact requests found</div>
//             <div className="text-gray-400 text-sm mt-1">New requests will appear here</div>
//           </div>
//         ) : (
//           <ContactTableView />
//         )}
//       </div>
//     </div>
//   );
// };

// export default RequestPage;










import React, { useState, useEffect } from 'react';
import { getContactData, getCallbacks, completeCallback } from '../../api/contactus';
import { CustomDatePicker } from '../ui/CustomDatePicker';

const RequestPage = () => {
  // Contact Requests states
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [contactSearchTerm, setContactSearchTerm] = useState('');
  
  // Customer Call Requests states
  const [callRequests, setCallRequests] = useState([]);
  const [filteredCallRequests, setFilteredCallRequests] = useState([]);
  const [callStartDate, setCallStartDate] = useState('');
  const [callEndDate, setCallEndDate] = useState('');
  const [loadingCallRequests, setLoadingCallRequests] = useState(true);
  const [callError, setCallError] = useState(null);
  const [callSearchTerm, setCallSearchTerm] = useState('');
  const [callStatusFilter, setCallStatusFilter] = useState('all');
  const [completingId, setCompletingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Pagination states for Contact Requests
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Pagination states for Call Requests
  const [currentPageCall, setCurrentPageCall] = useState(1);
  const [rowsPerPageCall, setRowsPerPageCall] = useState(10);
  
  // Track expanded descriptions for Contact Requests
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  
  // Track expanded reasons for Call Requests
  const [expandedReasons, setExpandedReasons] = useState({});

  // Fetch both data sets on mount
  useEffect(() => {
    fetchContactData();
    fetchCallRequestsData();
  }, []);

  // Apply filters for Contact Requests
  useEffect(() => {
    applyContactFilters();
  }, [contacts, startDate, endDate, contactSearchTerm]);

  // Apply filters for Call Requests
  useEffect(() => {
    applyCallFilters();
  }, [callRequests, callStartDate, callEndDate, callSearchTerm, callStatusFilter]);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Contact Requests filters
  const applyContactFilters = () => {
    let filtered = [...contacts];
    
    // Date filter
    if (startDate && endDate) {
      filtered = filtered.filter(contact => {
        const contactDate = new Date(contact.created_at);
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return contactDate >= start && contactDate <= end;
      });
    }
    
    // Search filter
    if (contactSearchTerm) {
      const term = contactSearchTerm.toLowerCase();
      filtered = filtered.filter(contact => 
        contact.full_name?.toLowerCase().includes(term) ||
        contact.mobile_number?.includes(term) ||
        contact.email_address?.toLowerCase().includes(term) ||
        contact.id?.toString().includes(term)
      );
    }
    
    setFilteredContacts(filtered);
    setCurrentPage(1);
  };

  // Call Requests filters
  const applyCallFilters = () => {
    let filtered = [...callRequests];
    
    // Date filter
    if (callStartDate && callEndDate) {
      filtered = filtered.filter(request => {
        const requestDate = new Date(request.created_at);
        const start = new Date(callStartDate);
        const end = new Date(callEndDate);
        end.setHours(23, 59, 59, 999);
        return requestDate >= start && requestDate <= end;
      });
    }
    
    // Search filter
    if (callSearchTerm) {
      const term = callSearchTerm.toLowerCase();
      filtered = filtered.filter(request => 
        request.customer_name?.toLowerCase().includes(term) ||
        request.customer_mobile?.includes(term) ||
        request.customer_email?.toLowerCase().includes(term) ||
        request.customer_id?.toLowerCase().includes(term) ||
        request.reason?.toLowerCase().includes(term)
      );
    }
    
    // Status filter
    if (callStatusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === callStatusFilter);
    }
    
    setFilteredCallRequests(filtered);
    setCurrentPageCall(1);
  };

  // Clear filters for Contact Requests
  const clearContactFilters = () => {
    setStartDate('');
    setEndDate('');
    setContactSearchTerm('');
    setCurrentPage(1);
  };

  // Clear filters for Call Requests
  const clearCallFilters = () => {
    setCallStartDate('');
    setCallEndDate('');
    setCallSearchTerm('');
    setCallStatusFilter('all');
    setCurrentPageCall(1);
  };

  // Fetch Contact Data
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

  // Fetch Customer Call Requests Data
  const fetchCallRequestsData = async () => {
    try {
      setLoadingCallRequests(true);
      const response = await getCallbacks();
      const items = response.items || [];
      const sortedItems = [...items].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setCallRequests(sortedItems);
      setCallError(null);
    } catch (err) {
      setCallError('Failed to fetch call requests');
      console.error('Error fetching call requests:', err);
    } finally {
      setLoadingCallRequests(false);
    }
  };

  // Mark callback as complete
  const handleCompleteCallback = async (callbackId) => {
    try {
      setCompletingId(callbackId);
      await completeCallback(callbackId);
      setSuccessMessage('Callback request marked as completed successfully!');
      await fetchCallRequestsData();
    } catch (err) {
      console.error('Failed to complete callback:', err);
      setCallError('Failed to update callback status');
      setTimeout(() => setCallError(null), 3000);
    } finally {
      setCompletingId(null);
    }
  };

  // Format date to dd/mm/yyyy
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Toggle description expansion for Contact Requests
  const toggleDescription = (id) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Toggle reason expansion for Call Requests
  const toggleReason = (id) => {
    setExpandedReasons(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Truncate text
  const truncateText = (text, maxLength = 100) => {
    if (!text || text === '—') return { isLong: false, truncated: text || '—', full: text || '—' };
    if (text.length <= maxLength) return { isLong: false, truncated: text, full: text };
    return {
      isLong: true,
      truncated: text.substring(0, maxLength) + '...',
      full: text
    };
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'bg-amber-100 text-amber-700',
      completed: 'bg-emerald-100 text-emerald-700',
      cancelled: 'bg-rose-100 text-rose-700'
    };
    return statusColors[status?.toLowerCase()] || 'bg-gray-100 text-gray-600';
  };

  // Pagination for Contact Requests
  const getCurrentPageData = () => {
    if (rowsPerPage === 'all') {
      return filteredContacts;
    }
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredContacts.slice(startIndex, endIndex);
  };

  // Pagination for Call Requests
  const getCurrentPageCallData = () => {
    if (rowsPerPageCall === 'all') {
      return filteredCallRequests;
    }
    const startIndex = (currentPageCall - 1) * rowsPerPageCall;
    const endIndex = startIndex + rowsPerPageCall;
    return filteredCallRequests.slice(startIndex, endIndex);
  };

  const handleRowsPerPageChange = (e) => {
    const value = e.target.value;
    setRowsPerPage(value === 'all' ? 'all' : parseInt(value));
    setCurrentPage(1);
  };

  const handleRowsPerPageCallChange = (e) => {
    const value = e.target.value;
    setRowsPerPageCall(value === 'all' ? 'all' : parseInt(value));
    setCurrentPageCall(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageChangeCall = (page) => {
    setCurrentPageCall(page);
  };

  const totalPages = rowsPerPage === 'all' ? 1 : Math.ceil(filteredContacts.length / rowsPerPage);
  const totalPagesCall = rowsPerPageCall === 'all' ? 1 : Math.ceil(filteredCallRequests.length / rowsPerPageCall);

  const getPageNumbers = (current, total) => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, current - Math.floor(maxVisible / 2));
    let endPage = Math.min(total, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const currentData = getCurrentPageData();
  const currentCallData = getCurrentPageCallData();

  // Description Cell Component for Contact Requests
  const DescriptionCell = ({ description, id }) => {
    const { isLong, truncated, full } = truncateText(description, 100);
    const isExpanded = expandedDescriptions[id];
    
    if (!description || description === '—') {
      return <div className="text-sm text-gray-400 italic">—</div>;
    }
    
    return (
      <div className="text-sm text-gray-600">
        <div className="whitespace-normal break-words">
          {isExpanded ? full : truncated}
        </div>
        {isLong && (
          <button
            onClick={() => toggleDescription(id)}
            className="mt-1 text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
    );
  };

  // Reason Cell Component for Call Requests
  const ReasonCell = ({ reason, id }) => {
    const { isLong, truncated, full } = truncateText(reason, 80);
    const isExpanded = expandedReasons[id];
    
    if (!reason || reason === '—') {
      return <div className="text-sm text-gray-400 italic">—</div>;
    }
    
    return (
      <div className="text-sm text-gray-600">
        <div className="whitespace-normal break-words">
          {isExpanded ? full : truncated}
        </div>
        {isLong && (
          <button
            onClick={() => toggleReason(id)}
            className="mt-1 text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
    );
  };

  // Contact Requests Table
  const ContactTableView = () => (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mobile</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[200px]">Description</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {currentData.map((contact) => (
            <tr key={contact.id} className="hover:bg-gray-50 transition-colors duration-150">
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                  {contact.id}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center justify-center">
                      <span className="text-white font-medium text-xs">{contact.full_name?.charAt(0).toUpperCase() || '?'}</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">{contact.full_name}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <a href={`tel:${contact.mobile_number}`} className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                  {contact.mobile_number}
                </a>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <a href={`mailto:${contact.email_address}`} className="text-sm text-gray-600 hover:text-indigo-600 transition-colors truncate max-w-[150px] block">
                  {contact.email_address}
                </a>
              </td>
              <td className="px-4 py-3">
                <DescriptionCell description={contact.description} id={contact.id} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {formatDate(contact.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-50 border-t border-gray-200">
          <tr>
            <td colSpan="6" className="px-4 py-3">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Rows per page:</span>
                  <select
                    value={rowsPerPage}
                    onChange={handleRowsPerPageChange}
                    className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value="all">All</option>
                  </select>
                </div>
                
                <div className="text-sm text-gray-500">
                  Showing {rowsPerPage === 'all' ? filteredContacts.length : Math.min((currentPage - 1) * rowsPerPage + 1, filteredContacts.length)} to{' '}
                  {rowsPerPage === 'all' ? filteredContacts.length : Math.min(currentPage * rowsPerPage, filteredContacts.length)} of {filteredContacts.length} entries
                </div>
                
                {rowsPerPage !== 'all' && totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => handlePageChange(1)} disabled={currentPage === 1} className="px-2 py-1 rounded-md text-sm bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">First</button>
                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-2 py-1 rounded-md text-sm bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Prev</button>
                    {getPageNumbers(currentPage, totalPages).map(page => (
                      <button key={page} onClick={() => handlePageChange(page)} className={`px-2 py-1 rounded-md text-sm ${currentPage === page ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>{page}</button>
                    ))}
                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-2 py-1 rounded-md text-sm bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
                    <button onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} className="px-2 py-1 rounded-md text-sm bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Last</button>
                  </div>
                )}
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );

  // Customer Call Requests Table
  const CallRequestsTableView = () => (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer ID</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer Name</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mobile</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[200px]">Reason</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {currentCallData.map((request) => (
            <tr key={request.id} className="hover:bg-gray-50 transition-colors duration-150">
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                  {request.customer_id}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center">
                      <span className="text-white font-medium text-xs">{request.customer_name?.charAt(0).toUpperCase() || '?'}</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">{request.customer_name}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <a href={`tel:${request.customer_mobile}`} className="text-sm text-gray-600 hover:text-emerald-600 transition-colors">
                  {request.customer_mobile}
                </a>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <a href={`mailto:${request.customer_email}`} className="text-sm text-gray-600 hover:text-emerald-600 transition-colors truncate max-w-[150px] block">
                  {request.customer_email}
                </a>
              </td>
              <td className="px-4 py-3">
                <ReasonCell reason={request.reason} id={request.id} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-md ${getStatusBadge(request.status)}`}>
                  {request.status?.toUpperCase()}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {formatDate(request.created_at)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {request.status === 'pending' && (
                  <button
                    onClick={() => handleCompleteCallback(request.id)}
                    disabled={completingId === request.id}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {completingId === request.id ? (
                      <>
                        <svg className="animate-spin h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Complete
                      </>
                    )}
                  </button>
                )}
                {request.status === 'completed' && (
                  <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-gray-50 text-gray-400">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Completed
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-50 border-t border-gray-200">
          <tr>
            <td colSpan="8" className="px-4 py-3">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Rows per page:</span>
                  <select
                    value={rowsPerPageCall}
                    onChange={handleRowsPerPageCallChange}
                    className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value="all">All</option>
                  </select>
                </div>
                
                <div className="text-sm text-gray-500">
                  Showing {rowsPerPageCall === 'all' ? filteredCallRequests.length : Math.min((currentPageCall - 1) * rowsPerPageCall + 1, filteredCallRequests.length)} to{' '}
                  {rowsPerPageCall === 'all' ? filteredCallRequests.length : Math.min(currentPageCall * rowsPerPageCall, filteredCallRequests.length)} of {filteredCallRequests.length} entries
                </div>
                
                {rowsPerPageCall !== 'all' && totalPagesCall > 1 && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => handlePageChangeCall(1)} disabled={currentPageCall === 1} className="px-2 py-1 rounded-md text-sm bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50">First</button>
                    <button onClick={() => handlePageChangeCall(currentPageCall - 1)} disabled={currentPageCall === 1} className="px-2 py-1 rounded-md text-sm bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50">Prev</button>
                    {getPageNumbers(currentPageCall, totalPagesCall).map(page => (
                      <button key={page} onClick={() => handlePageChangeCall(page)} className={`px-2 py-1 rounded-md text-sm ${currentPageCall === page ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>{page}</button>
                    ))}
                    <button onClick={() => handlePageChangeCall(currentPageCall + 1)} disabled={currentPageCall === totalPagesCall} className="px-2 py-1 rounded-md text-sm bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50">Next</button>
                    <button onClick={() => handlePageChangeCall(totalPagesCall)} disabled={currentPageCall === totalPagesCall} className="px-2 py-1 rounded-md text-sm bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50">Last</button>
                  </div>
                )}
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );

  if (loading && loadingCallRequests) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <div className="text-gray-500">Loading data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 animate-slide-down">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 shadow-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-emerald-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-emerald-700">{successMessage}</span>
            </div>
          </div>
        </div>
      )}

      {/* Customer Call Requests Section */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Customer Call Requests</h1>
            <p className="text-sm text-gray-500 mt-1">Manage and respond to customer callback requests</p>
          </div>
          <button
            onClick={fetchCallRequestsData}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 shadow-sm"
          >
            <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Call Requests Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 mb-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <h2 className="text-base font-medium text-gray-700">Filters</h2>
            </div>
            <button
              onClick={clearCallFilters}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Search</label>
              <input
                type="text"
                value={callSearchTerm}
                onChange={(e) => setCallSearchTerm(e.target.value)}
                placeholder="Name, Mobile, Email..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
              <select
                value={callStatusFilter}
                onChange={(e) => setCallStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Start Date</label>
              <CustomDatePicker
                value={callStartDate}
                onChange={(value) => setCallStartDate(value)}
                placeholder="dd/mm/yyyy"
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">End Date</label>
              <CustomDatePicker
                value={callEndDate}
                onChange={(value) => setCallEndDate(value)}
                placeholder="dd/mm/yyyy"
                className="w-full"
              />
            </div>
          </div>
        </div>
        
        {callError ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-rose-600 bg-rose-50 px-4 py-2 rounded-lg text-sm">{callError}</div>
          </div>
        ) : loadingCallRequests ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : filteredCallRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg border border-gray-200">
            <svg className="w-16 h-16 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <div className="text-gray-500 font-medium">No call requests found</div>
            <div className="text-gray-400 text-sm mt-1">New requests will appear here</div>
          </div>
        ) : (
          <CallRequestsTableView />
        )}
      </div>

      {/* Contact Requests Section */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Contact Requests</h1>
            <p className="text-sm text-gray-500 mt-1">Manage and respond to customer inquiries</p>
          </div>
          <button
            onClick={fetchContactData}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 shadow-sm"
          >
            <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Contact Requests Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 mb-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <h2 className="text-base font-medium text-gray-700">Filters</h2>
            </div>
            <button
              onClick={clearContactFilters}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Search</label>
              <input
                type="text"
                value={contactSearchTerm}
                onChange={(e) => setContactSearchTerm(e.target.value)}
                placeholder="Name, Mobile, Email..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Start Date</label>
              <CustomDatePicker
                value={startDate}
                onChange={(value) => setStartDate(value)}
                placeholder="dd/mm/yyyy"
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">End Date</label>
              <CustomDatePicker
                value={endDate}
                onChange={(value) => setEndDate(value)}
                placeholder="dd/mm/yyyy"
                className="w-full"
              />
            </div>
          </div>
        </div>
        
        {error ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-rose-600 bg-rose-50 px-4 py-2 rounded-lg text-sm">{error}</div>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg border border-gray-200">
            <svg className="w-16 h-16 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <div className="text-gray-500 font-medium">No contact requests found</div>
            <div className="text-gray-400 text-sm mt-1">New requests will appear here</div>
          </div>
        ) : (
          <ContactTableView />
        )}
      </div>
    </div>
  );
};

export default RequestPage;