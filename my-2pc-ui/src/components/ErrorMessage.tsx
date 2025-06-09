import React from 'react';
interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  icon?: React.ReactNode;
}
const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry, icon }) => {
  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong className="font-bold mr-2">{icon} Error!</strong>
      <span className="block sm:inline">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="ml-4 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Retry
        </button>
      )}
    </div>
  );
};
export default ErrorMessage;