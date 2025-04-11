// EnhancedSpeechToText.jsx - Brand new speech recognition implementation
import React, { useEffect, useRef, useState } from 'react';

const EnhancedSpeechToText = ({ onTextResult, isDarkMode }) => {
  // Main state
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [permissionGranted, setPermissionGranted] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [restartCount, setRestartCount] = useState(0);

  // Refs to manage the recognition instance and state between renders
  const recognitionRef = useRef(null);
  const accumulatedTextRef = useRef('');
  const isListeningRef = useRef(false);
  const restartTimerRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Simulate audio levels for visualization
  const simulateAudioLevel = () => {
    if (isListeningRef.current) {
      setAudioLevel(Math.random() * 70 + 30); // Random value between 30-100
      animationFrameRef.current = requestAnimationFrame(simulateAudioLevel);
    } else {
      setAudioLevel(0);
    }
  };

  // Initialize speech recognition
  useEffect(() => {
    // Check if speech recognition is supported
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported in this browser');
      setErrorMessage('Speech recognition not supported in this browser');
      return;
    }

    // Create speech recognition instance
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Configure recognition
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = 'en-US';

    // Handle recognition start
    recognition.onstart = () => {
      console.log('Speech recognition started (attempt #' + restartCount + ')');
      setIsListening(true);
      isListeningRef.current = true;
      setErrorMessage('');
      
      // Start audio level visualization
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      simulateAudioLevel();
    };

    // Handle recognition results
    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      // Process results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Update interim text (what's being processed)
      if (interimTranscript) {
        setInterimText(interimTranscript);
      }

      // Handle final transcript
      if (finalTranscript) {
        // Add space if needed
        const needsSpace = !finalTranscript.endsWith(' ') && accumulatedTextRef.current.length > 0;
        accumulatedTextRef.current += (needsSpace ? ' ' : '') + finalTranscript;
        
        // Send to parent component
        onTextResult(accumulatedTextRef.current.trim());
        
        // Schedule restart to keep recognition active
        scheduleRestart();
      }
    };

    // Handle recognition errors
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error, event);
      
      switch (event.error) {
        case 'not-allowed':
        case 'service-not-allowed':
          setPermissionGranted(false);
          setErrorMessage('Microphone access denied. Please allow microphone access.');
          stopListening();
          break;
        case 'aborted':
          // This happens when we stop the recognition intentionally - not a true error
          console.log('Recognition aborted - restarting');
          scheduleRestart(100); // Quick restart
          break;
        case 'network':
          setErrorMessage('Network error. Check your connection.');
          scheduleRestart(1000); // Try again after a short delay
          break;
        case 'no-speech':
          console.log('No speech detected');
          scheduleRestart(500); // Try again after a short delay
          break;
        default:
          setErrorMessage(`Error: ${event.error}`);
          scheduleRestart(1000); // Try again after a short delay
      }
    };

    // Handle recognition end
    recognition.onend = () => {
      console.log('Speech recognition ended');
      
      // If we're still supposed to be listening, schedule a restart
      if (isListeningRef.current) {
        scheduleRestart();
      } else {
        // We intentionally stopped
        setIsListening(false);
        setInterimText('');
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          setAudioLevel(0);
        }
      }
    };

    // Store recognition instance in ref
    recognitionRef.current = recognition;

    // Cleanup on unmount
    return () => {
      if (isListeningRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error('Error stopping recognition during cleanup:', e);
        }
      }
      
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [onTextResult, restartCount]);

  // Start listening
  const startListening = () => {
    if (!recognitionRef.current || !permissionGranted) return;
    
    try {
      // Reset accumulated text
      accumulatedTextRef.current = '';
      setInterimText('');
      
      // Update state
      isListeningRef.current = true;
      
      // Start recognition
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      
      // If already started, try stopping and starting again
      if (error.message.includes('already started')) {
        try {
          recognitionRef.current.stop();
          
          // Wait a moment, then try starting again
          setTimeout(() => {
            if (isListeningRef.current) {
              recognitionRef.current.start();
            }
          }, 100);
        } catch (stopError) {
          console.error('Error stopping already started recognition:', stopError);
        }
      }
    }
  };

  // Stop listening
  const stopListening = () => {
    if (!recognitionRef.current) return;
    
    try {
      // Update state
      isListeningRef.current = false;
      
      // Stop recognition
      recognitionRef.current.stop();
      
      // Clear restart timer
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
      }
      
      // Stop audio visualization
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        setAudioLevel(0);
      }
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  };

  // Toggle listening state
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Schedule a restart of the recognition service
  const scheduleRestart = (delay = 300) => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
    }
    
    restartTimerRef.current = setTimeout(() => {
      // Only restart if we're still supposed to be listening
      if (isListeningRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          
          // Wait a moment before starting again to avoid browser issues
          setTimeout(() => {
            if (isListeningRef.current) {
              setRestartCount(prev => prev + 1); // This will trigger a re-initialization
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.error('Failed to restart recognition:', e);
              }
            }
          }, 100);
        } catch (error) {
          console.error('Error during scheduled restart:', error);
        }
      }
    }, delay);
  };

  // If speech recognition is not supported
  if (!recognitionRef.current && errorMessage.includes('not supported')) {
    return (
      <button 
        className={`${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'} px-3 py-2 rounded opacity-50 cursor-not-allowed`}
        disabled
        title="Speech recognition is not supported in your browser"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="relative">
      {/* Main button */}
      <button
        onClick={toggleListening}
        className={`${
          isListening 
            ? isDarkMode ? 'bg-red-700 text-white' : 'bg-red-500 text-white' 
            : isDarkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-100 hover:bg-blue-200'
        } px-3 py-2 rounded transition-colors relative flex items-center justify-center`}
        title={isListening ? "Stop listening" : "Start voice input"}
        disabled={!permissionGranted}
      >
        {isListening ? (
          <>
            {/* Animated audio level indicators */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center space-x-1">
                {[1, 2, 3].map((bar) => (
                  <div 
                    key={bar} 
                    className="w-1 bg-white rounded"
                    style={{
                      height: `${Math.min(6 + (audioLevel / 10) * bar, 24)}px`,
                      opacity: 0.7 + (bar * 0.1),
                      transition: 'height 0.1s ease'
                    }}
                  />
                ))}
              </div>
            </div>
            <span className="opacity-0">Mic</span>
          </>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>
      
      {/* Transcript bubble */}
      {isListening && (
        <div 
          className={`absolute bottom-full mb-2 p-3 rounded-lg ${
            isDarkMode ? 'bg-gray-700' : 'bg-white'
          } shadow-lg min-w-[200px] max-w-[300px] z-10`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className={`text-xs font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              {isListening ? 'Listening...' : ''}
            </span>
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Speak clearly
            </span>
          </div>
          
          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} min-h-[1.5rem]`}>
            {interimText || accumulatedTextRef.current || 
              <span className="italic text-gray-400 dark:text-gray-500">Waiting for speech...</span>
            }
          </p>
          
          {/* Audio level visualizer */}
          <div className="w-full h-1 bg-gray-200 dark:bg-gray-600 mt-2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-100"
              style={{ width: `${audioLevel}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Error message */}
      {errorMessage && (
        <div className="absolute bottom-full left-0 mb-2 p-2 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg text-xs text-red-700 dark:text-red-300 max-w-xs">
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default EnhancedSpeechToText;