import React from 'react';

interface PendingApprovalModalProps {
  onBackToLogin: () => void;
}

const PendingApprovalModal: React.FC<PendingApprovalModalProps> = ({ onBackToLogin }) => {
  return (
    <div className="text-center p-8">
      <svg 
        className="w-24 h-24 mx-auto text-green-500" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth="2" 
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <h1 className="text-3xl font-black text-cyan-800 mt-6">تم إرسال طلبك</h1>
      <p className="text-lg text-slate-600 mt-2">
        طلبك قيد المراجعة حالياً. سيتم إعلامك عند الموافقة عليه.
      </p>
      <button
        onClick={onBackToLogin}
        className="w-full sm:w-auto mt-10 text-white bg-cyan-600 hover:bg-cyan-700 focus:ring-4 focus:outline-none focus:ring-cyan-300 font-bold rounded-lg text-sm px-8 py-3 text-center transition-transform transform hover:scale-105"
      >
        العودة إلى صفحة الدخول
      </button>
    </div>
  );
};

export default PendingApprovalModal; 