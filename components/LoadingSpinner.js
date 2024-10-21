import React from 'react';

const LoadingSpinner = () => {
    return (
        <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-screen z-50 overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div>
            <h2 className="text-center text-white text-xl font-semibold mt-5">Loading...</h2>
            <p className="w-1/3 text-center text-white">This may take a few seconds, please don't close this page.</p>
        </div>
    );
};

export default LoadingSpinner;
