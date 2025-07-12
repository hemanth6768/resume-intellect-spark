
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
  className?: string;
}

const ExpandableText: React.FC<ExpandableTextProps> = ({ 
  text, 
  maxLength = 150, 
  className = "" 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (text.length <= maxLength) {
    return <p className={className}>{text}</p>;
  }

  const truncatedText = text.substring(0, maxLength);
  const remainingText = text.substring(maxLength);

  return (
    <div className={className}>
      <p>
        {truncatedText}
        {!isExpanded && '...'}
        {isExpanded && remainingText}
      </p>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm mt-1 font-medium"
      >
        {isExpanded ? (
          <>
            <ChevronUp className="w-3 h-3" />
            Show less
          </>
        ) : (
          <>
            <ChevronDown className="w-3 h-3" />
            Show more
          </>
        )}
      </button>
    </div>
  );
};

export default ExpandableText;
