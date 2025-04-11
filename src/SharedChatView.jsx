import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const SharedChatView = () => {
  const { shareId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatData, setChatData] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('isDarkMode');
    return saved !== null ? JSON.parse(saved) : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };
  
  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  
  // Fetch the shared chat
  useEffect(() => {
    const fetchSharedChat = async () => {
      try {
        setLoading(true);
        const db = getFirestore();
        
        // Get the shared chat document
        const sharedDocRef = doc(db, 'shared', shareId);
        const sharedDocSnap = await getDoc(sharedDocRef);
        
        if (!sharedDocSnap.exists()) {
          throw new Error("This shared chat doesn't exist or has been removed.");
        }
        
        const sharedData = sharedDocSnap.data();
        setChatData(sharedData.chat);
      } catch (err) {
        console.error('Error fetching shared chat:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSharedChat();
  }, [shareId]);
  
  if (loading) {
    return (
      <div className={`flex items-center justify-center h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 dark:text-gray-300">Loading shared chat...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`flex items-center justify-center h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
        <div className="text-center max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Chat</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <Link to="/" className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-100'}`}>
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <h1 className="text-xl font-bold text-blue-700 dark:text-blue-400">AI Dental Assistant</h1>
              <div className="ml-2 text-xs text-gray-600 dark:text-gray-400">Shared Chat</div>
            </Link>
          </div>
          <button 
            onClick={toggleDarkMode}
            className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden p-6">
          <h2 className="text-xl font-bold mb-4">Shared Chat: {chatData?.name || 'Chat'}</h2>
          
          {chatData?.messages ? (
            <div>
              {chatData.messages
                .filter(msg => msg.role !== 'system')
                .map((message, index) => (
                  <div 
                    key={index} 
                    className={`mb-4 p-4 rounded ${
                      message.role === 'user' 
                        ? 'bg-blue-100 dark:bg-blue-900 ml-12' 
                        : 'bg-green-100 dark:bg-green-900 mr-12'
                    }`}
                  >
                    <div className="font-bold mb-1">
                      {message.role === 'user' ? 'Patient' : 'Dental Assistant'}
                    </div>
                    <div>{message.content}</div>
                  </div>
                ))
              }
            </div>
          ) : (
            <p>No messages found in this chat.</p>
          )}
          
          <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link to="/" className="text-blue-600 dark:text-blue-400">
              Return to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SharedChatView;