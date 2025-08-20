import React from 'react'

const EmptyState = () => {
  return (
    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
      <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Selected</h3>
      <p className="text-gray-500 mb-4">Select a country from the filters above to view available products for your custom declaration form.</p>
      <p className="text-sm text-gray-400">Once you select a country, products will appear below for you to add to your declaration.</p>
    </div>
  )
}

export default EmptyState
