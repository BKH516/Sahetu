import React, { useState, useEffect } from 'react';

interface CaptchaProps {
  onVerify: (isValid: boolean) => void;
  onRefresh?: () => void;
  className?: string;
}

interface CaptchaPuzzle {
  question: string;
  answer: number;
  options: number[];
}

const Captcha: React.FC<CaptchaProps> = ({ onVerify, onRefresh, className = '' }) => {
  const [puzzle, setPuzzle] = useState<CaptchaPuzzle | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isVerified, setIsVerified] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showError, setShowError] = useState(false);

  
  const generatePuzzle = (): CaptchaPuzzle => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operation = Math.random() > 0.5 ? '+' : '-';
    const answer = operation === '+' ? num1 + num2 : num1 - num2;
    
    
    const wrongAnswers = [
      answer + Math.floor(Math.random() * 5) + 1,
      answer - Math.floor(Math.random() * 5) - 1,
      answer + Math.floor(Math.random() * 3) + 2
    ].filter((val, index, arr) => arr.indexOf(val) === index && val !== answer);

    const options = [answer, ...wrongAnswers].sort(() => Math.random() - 0.5);

    return {
      question: `ما هو ناتج ${num1} ${operation} ${num2}؟`,
      answer,
      options
    };
  };

  useEffect(() => {
    setPuzzle(generatePuzzle());
  }, []);

  const handleVerify = () => {
    if (!puzzle) return;

    const answer = parseInt(userAnswer);
    const isValid = answer === puzzle.answer;

    if (isValid) {
      setIsVerified(true);
      setShowError(false);
      onVerify(true);
    } else {
      setAttempts(prev => prev + 1);
      setShowError(true);
      setUserAnswer('');
      
      
      if (attempts >= 2) {
        setPuzzle(generatePuzzle());
        setAttempts(0);
      }
      
      onVerify(false);
    }
  };

  const handleRefresh = () => {
    setPuzzle(generatePuzzle());
    setUserAnswer('');
    setIsVerified(false);
    setAttempts(0);
    setShowError(false);
    onVerify(false);
    onRefresh?.();
  };

  if (!puzzle) return null;

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 ${className}`}>
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          التحقق من الأمان
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          يرجى حل هذا اللغز للتحقق من أنك إنسان
        </p>
      </div>

      <div className="space-y-4">
        {}
        <div className="text-center">
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {puzzle.question}
          </p>
        </div>

        {}
        <div className="grid grid-cols-2 gap-2">
          {puzzle.options.map((option, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setUserAnswer(option.toString())}
              className={`p-3 text-center rounded-lg border transition-colors ${
                userAnswer === option.toString()
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
              disabled={isVerified}
            >
              {option}
            </button>
          ))}
        </div>

        {}
        {showError && (
          <div className="text-center">
            <p className="text-sm text-red-600 dark:text-red-400">
              إجابة خاطئة، حاول مرة أخرى
            </p>
          </div>
        )}

        {}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleVerify}
            disabled={!userAnswer || isVerified}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {isVerified ? 'تم التحقق' : 'تحقق'}
          </button>
          
          <button
            type="button"
            onClick={handleRefresh}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            ↻
          </button>
        </div>

        {}
        {isVerified && (
          <div className="text-center">
            <div className="inline-flex items-center text-green-600 dark:text-green-400">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              تم التحقق بنجاح
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Captcha; 