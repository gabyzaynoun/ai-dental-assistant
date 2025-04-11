// TypedMessage.jsx
import React, { useState, useEffect, useRef } from 'react';

const TypedMessage = ({ message, isDarkMode, isLastMessage }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingComplete, setTypingComplete] = useState(false);
  const isUser = message.role === 'user';
  const timestamp = message.timestamp ? new Date(message.timestamp) : null;
  
  // Calculate typing speed - adjust values for more natural feel
  const baseSpeed = 10; // milliseconds per character
  const variability = 7; // random variability range
  const punctuationPause = 200; // pause on punctuation
  
  // For pausing/resuming animation
  const fullContent = useRef(message.content);
  const charIndex = useRef(0);
  const timeoutRef = useRef(null);
  
  // Reset if message content changes
  useEffect(() => {
    fullContent.current = message.content;
    
    // Skip animation for user messages or when it's not the last message
    if (isUser || !isLastMessage) {
      setDisplayedText(message.content);
      setTypingComplete(true);
      return;
    }
    
    // Initialize for typing animation
    setDisplayedText('');
    charIndex.current = 0;
    setIsTyping(true);
    setTypingComplete(false);
    
    // Start typing animation
    typeNextChar();
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [message.content, isLastMessage]);
  
  const typeNextChar = () => {
    if (charIndex.current < fullContent.current.length) {
      const currentChar = fullContent.current[charIndex.current];
      setDisplayedText(prev => prev + currentChar);
      charIndex.current += 1;
      
      // Add delay for punctuation
      const isPunctuation = ['.', '!', '?', ',', ';', ':'].includes(currentChar);
      const delay = isPunctuation
        ? punctuationPause
        : baseSpeed + Math.random() * variability;
      
      timeoutRef.current = setTimeout(typeNextChar, delay);
    } else {
      setIsTyping(false);
      setTypingComplete(true);
    }
  };
  
  // Skip animation on click
  const handleClick = () => {
    if (isTyping) {
      // Clear timeout to stop current typing
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Show full message
      setDisplayedText(fullContent.current);
      setIsTyping(false);
      setTypingComplete(true);
    }
  };
  
  return (
    <div
      className={`mb-4 ${isUser ? 'text-right' : 'text-left'}`}
    >
      <div
        className={`inline-block px-4 py-2 rounded-lg cursor-pointer ${
          isUser 
            ? isDarkMode ? 'bg-blue-900 text-white' : 'bg-blue-100' 
            : isDarkMode ? 'bg-green-900 text-white' : 'bg-green-100'
        }`}
        onClick={handleClick}
      >
        {displayedText}
        {isTyping && <span className="animate-pulse ml-1">▋</span>}
        
        {timestamp && typingComplete && (
          <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TypedMessage;