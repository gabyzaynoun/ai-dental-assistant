// ========== Enhanced AI Dental Assistant with Pro Features ==========
import * as React from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { formatDistanceToNow } from 'date-fns';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CryptoJS from 'crypto-js';
import EnhancedSpeechToText from './EnhancedSpeechToText';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBHy56LDPFQ__56EgCCVnWEFrODdPFlgnw",
  authDomain: "ai-dental-assistant-e758a.firebaseapp.com",
  projectId: "ai-dental-assistant-e758a",
  storageBucket: "ai-dental-assistant-e758a.firebasestorage.app",
  messagingSenderId: "53910361522",
  appId: "1:53910361522:web:b999036ad513bad95300ab",
  measurementId: "G-1MPKSVFXY5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Encryption key (you should use a more secure method in production)
const ENCRYPTION_KEY = "AI_DENTAL_ASSISTANT_SECRET_KEY";

// Helper for encrypting data
const encryptData = (data) => {
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
};

// Helper for decrypting data
const decryptData = (encryptedData) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("Decryption error:", error);
    return "";
  }
};

// Tag Pill Component
const TagPill = ({ tag, onClick, onDelete, isSelected }) => (
  <div 
    className={`inline-flex items-center rounded-full px-3 py-1 text-xs mr-2 mb-2 cursor-pointer ${
      isSelected 
        ? 'bg-blue-500 text-white dark:bg-blue-600' 
        : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    }`}
    onClick={onClick}
  >
    {tag}
    {onDelete && (
      <button 
        className="ml-1 text-xs" 
        onClick={(e) => {
          e.stopPropagation();
          onDelete(tag);
        }}
      >
        &times;
      </button>
    )}
  </div>
);

// Folder System Component
const FolderSystem = ({ 
  folders, 
  onCreateFolder, 
  onDeleteFolder, 
  onSelectFolder, 
  selectedFolder,
  allTags,
  selectedTags,
  onTagSelect
}) => {
  const [newFolderName, setNewFolderName] = React.useState('');
  
  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      toast.success(`Folder "${newFolderName.trim()}" created successfully!`);
    }
  };
  
  return (
    <div className="mb-4">
      <h3 className="font-bold mb-2 text-gray-700 dark:text-gray-300">Folders</h3>
      
      <div className="mb-3 flex">
        <input
          type="text"
          placeholder="New folder name"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          className="flex-1 p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
        <button
          onClick={handleCreateFolder}
          className="ml-1 px-2 py-1 bg-green-600 text-white rounded text-sm"
        >
          +
        </button>
      </div>
      
      <div className="mb-3">
        <div 
          className={`px-2 py-1 mb-1 rounded cursor-pointer ${
            selectedFolder === null 
              ? 'bg-blue-100 dark:bg-blue-900' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          onClick={() => onSelectFolder(null)}
        >
          All Chats
        </div>
        
        {folders.map(folder => (
          <div 
            key={folder.id}
            className={`px-2 py-1 mb-1 rounded cursor-pointer flex justify-between items-center ${
              selectedFolder === folder.id 
                ? 'bg-blue-100 dark:bg-blue-900' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span onClick={() => onSelectFolder(folder.id)}>{folder.name}</span>
            <button 
              className="text-red-600 dark:text-red-400 text-xs"
              onClick={() => {
                if (confirm(`Delete folder "${folder.name}"?`)) {
                  onDeleteFolder(folder.id);
                  toast.info(`Folder "${folder.name}" deleted!`);
                }
              }}
            >
              &times;
            </button>
          </div>
        ))}
      </div>
      
      <h3 className="font-bold mb-2 text-gray-700 dark:text-gray-300">Filter by Tags</h3>
      <div className="flex flex-wrap mb-3">
        {allTags.length === 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400">No tags yet</div>
        )}
        
        {allTags.map(tag => (
          <TagPill 
            key={tag} 
            tag={tag} 
            isSelected={selectedTags.includes(tag)}
            onClick={() => onTagSelect(tag)}
          />
        ))}
      </div>
      
      {selectedTags.length > 0 && (
        <button
          onClick={() => {
            onTagSelect(null); // Clear tag filter
            toast.info('Tag filters cleared');
          }}
          className="text-xs text-blue-600 dark:text-blue-400"
        >
          Clear tag filters
        </button>
      )}
    </div>
  );
};

// Auth Component
const AuthComponent = ({ user, onLogin, onSignUp, onLogout }) => {
  const [isLoginMode, setIsLoginMode] = React.useState(true);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isLoginMode) {
        await onLogin(email, password);
        toast.success('Logged in successfully!');
      } else {
        await onSignUp(email, password);
        toast.success('Account created and logged in!');
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    }
  };
  
  if (user) {
    return (
      <div className="mb-4 p-3 border rounded dark:border-gray-700">
        <p className="text-sm mb-2">
          Logged in as <span className="font-bold">{user.email}</span>
        </p>
        <button
          onClick={onLogout}
          className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    );
  }
  
  return (
    <div className="mb-4 p-3 border rounded dark:border-gray-700">
      <h3 className="text-lg font-bold mb-2">{isLoginMode ? 'Login' : 'Sign Up'}</h3>
      
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
        <div className="mb-2">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
        <div className="flex justify-between items-center">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {isLoginMode ? 'Login' : 'Sign Up'}
          </button>
          <button
            type="button"
            onClick={() => setIsLoginMode(!isLoginMode)}
            className="text-sm text-blue-600 dark:text-blue-400"
          >
            {isLoginMode ? 'Need an account?' : 'Already have an account?'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Chat Card Component for cleaner code organization
const ChatCard = ({ 
  chat, 
  isActive, 
  onSelect, 
  onRename, 
  onTagEdit, 
  onDelete, 
  index, 
  moveChat,
  onMoveToFolder,
  folders,
  onShareChat 
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedTag, setEditedTag] = React.useState(chat.tag || '');
  const [folderMenuOpen, setFolderMenuOpen] = React.useState(false);
  
  // Implement drag and drop functionality
  const [{ isDragging }, drag] = useDrag({
    type: 'CHAT',
    item: { id: chat.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  
  const [, drop] = useDrop({
    accept: 'CHAT',
    hover(item, monitor) {
      if (item.index !== index) {
        moveChat(item.index, index);
        item.index = index;
      }
    },
  });
  
  const handleTagSubmit = () => {
    onTagEdit(chat.id, editedTag);
    setIsEditing(false);
    toast.success('Tag updated successfully!');
  };
  
  return (
    <div 
      ref={(node) => drag(drop(node))}
      className={`relative mb-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      style={{ cursor: 'move' }}
    >
      <div 
        className={`p-2 rounded flex justify-between items-start ${
          isActive ? 'bg-blue-100 dark:bg-blue-900 font-semibold' : ''
        }`}
      >
        <div 
          className="flex-1" 
          onClick={() => onSelect(chat.id)}
          style={{ cursor: 'pointer' }}
        >
          <div className="truncate pr-2">
            {chat.name}
            {chat.folderId && (
              <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 px-1 rounded">
                {folders.find(f => f.id === chat.folderId)?.name || 'Folder'}
              </span>
            )}
            {chat.shared && (
              <span className="ml-2 text-xs bg-green-200 dark:bg-green-700 px-1 rounded">
                Shared
              </span>
            )}
          </div>
          {isEditing ? (
            <div className="flex mt-1">
              <input
                type="text"
                className="text-xs border rounded px-1 py-0.5 w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={editedTag}
                onChange={(e) => setEditedTag(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTagSubmit();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
              />
              <button 
                className="text-xs bg-blue-500 text-white px-1 ml-1 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTagSubmit();
                }}
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap mt-1">
              {chat.tag && (
                <div className="text-xs bg-gray-200 dark:bg-gray-700 px-1 rounded inline-block mr-1">
                  {chat.tag}
                </div>
              )}
            </div>
          )}
          {chat.lastUpdated && (
            <div className="text-xs text-gray-400 dark:text-gray-500">
              {formatDistanceToNow(new Date(chat.lastUpdated), { addSuffix: true })}
            </div>
          )}
        </div>
        
        <div 
          className="relative"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
        >
          <button
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded shadow-lg z-10 py-1">
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onRename(chat.id);
                  setMenuOpen(false);
                }}
              >
                Rename
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                  setMenuOpen(false);
                }}
              >
                Edit Tag
              </button>
              {/* Share Chat button */}
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onShareChat(chat.id);
                  setMenuOpen(false);
                }}
              >
                Share Chat
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 relative"
                onClick={(e) => {
                  e.stopPropagation();
                  setFolderMenuOpen(!folderMenuOpen);
                }}
              >
                Move to Folder
                {folderMenuOpen && (
                  <div className="absolute left-full top-0 bg-white dark:bg-gray-800 rounded shadow-lg z-20 py-1 w-40">
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveToFolder(chat.id, null);
                        setFolderMenuOpen(false);
                        setMenuOpen(false);
                        toast.success('Removed from folder');
                      }}
                    >
                      No Folder
                    </button>
                    {folders.map(folder => (
                      <button
                        key={folder.id}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveToFolder(chat.id, folder.id);
                          setFolderMenuOpen(false);
                          setMenuOpen(false);
                          toast.success(`Moved to "${folder.name}"`);
                        }}
                      >
                        {folder.name}
                      </button>
                    ))}
                  </div>
                )}
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(chat.id);
                  setMenuOpen(false);
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Message component with timestamps and typewriter effect
const Message = ({ message, isDarkMode, typingAnimation = false }) => {
  const isUser = message.role === 'user';
  const timestamp = message.timestamp ? new Date(message.timestamp) : null;
  
  // For debugging - log each message being rendered
  React.useEffect(() => {
    console.log(`Rendering message - Role: ${message.role}, Content: ${message.content.substring(0, 30)}...`);
  }, [message]);
  
  // For typewriter effect
  const [displayedContent, setDisplayedContent] = React.useState(
    isUser || !typingAnimation ? message.content : ''
  );
  const [isTyping, setIsTyping] = React.useState(!isUser && typingAnimation);
  
  React.useEffect(() => {
    if (!isUser && typingAnimation) {
      // Reset when new message comes in
      setDisplayedContent('');
      setIsTyping(true);
      
      const fullText = message.content;
      let currentIndex = 0;
      
      const typingInterval = setInterval(() => {
        if (currentIndex < fullText.length) {
          setDisplayedContent(fullText.substring(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(typingInterval);
          setIsTyping(false);
        }
      }, 10); // Adjust speed as needed
      
      return () => clearInterval(typingInterval);
    }
  }, [isUser, message.content, typingAnimation]);
  
  // Use different background colors for user vs assistant messages
  const bgColorClass = isUser 
    ? isDarkMode ? 'bg-blue-900 text-white' : 'bg-blue-100' 
    : isDarkMode ? 'bg-green-900 text-white' : 'bg-green-100';
  
  return (
    <div
      className={`mb-4 ${isUser ? 'text-right' : 'text-left'}`}
      data-role={message.role} // Add data attribute for debugging
    >
      <div
        className={`inline-block px-4 py-2 rounded-lg ${bgColorClass}`}
      >
        {isUser ? message.content : displayedContent}
        {!isUser && isTyping && (
          <span className="inline-block w-1 h-4 ml-1 bg-current animate-pulse"></span>
        )}
        {timestamp && (
          <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
};

// Pro Badge Component
const ProBadge = () => (
  <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded font-semibold ml-2">
    PRO
  </span>
);

// Share Modal Component
const ShareModal = ({ isOpen, onClose, sharableLink, onCopyLink }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-bold mb-4 dark:text-white">Share Chat</h3>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
          Share this link with others to let them view this chat in read-only mode.
        </p>
        
        <div className="flex mb-4">
          <input
            type="text"
            value={sharableLink}
            readOnly
            className="flex-1 p-2 border rounded-l text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <button
            onClick={onCopyLink}
            className="bg-blue-600 text-white px-4 py-2 rounded-r"
          >
            Copy
          </button>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

function App() {
  // ========== STATE ==========
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  
  // For mobile responsiveness
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  
  // For search functionality
  const [searchTerm, setSearchTerm] = React.useState('');
  
  // For chat summary
  const [chatSummary, setChatSummary] = React.useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = React.useState(false);
  
  // Dark mode support
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    const saved = localStorage.getItem('isDarkMode');
    return saved !== null ? JSON.parse(saved) : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  
  // Firebase user state
  const [user, setUser] = React.useState(null);
  const [isInitializing, setIsInitializing] = React.useState(true);
  
  // Folder system
  const [folders, setFolders] = React.useState(() => {
    const stored = localStorage.getItem('dentalFolders');
    return stored ? JSON.parse(stored) : [];
  });
  
  const [selectedFolder, setSelectedFolder] = React.useState(null);
  
  // Tag filtering
  const [selectedTags, setSelectedTags] = React.useState([]);
  const [allTags, setAllTags] = React.useState([]);
  
  // Store multiple chats in an object, keyed by ID - IMPROVED
  const [allChats, setAllChats] = React.useState(() => {
    try {
      const stored = localStorage.getItem('dentalChats');
      if (stored) {
        const parsedChats = JSON.parse(stored);
        console.log("Loaded chats from localStorage, count:", Object.keys(parsedChats).length);
        return parsedChats;
      }
    } catch (error) {
      console.error("Error loading chats from localStorage:", error);
      toast.error("Error loading saved chats: " + error.message);
    }
    return {};
  });

  // Track which chat is currently selected
  const [currentChatId, setCurrentChatId] = React.useState(() => {
    const savedId = localStorage.getItem('currentChatId');
    console.log("Loaded currentChatId from localStorage:", savedId);
    return savedId || null;
  });
  
  // Track chat order for drag and drop
  const [chatOrder, setChatOrder] = React.useState(() => {
    try {
      const stored = localStorage.getItem('chatOrder');
      if (stored) {
        const order = JSON.parse(stored);
        console.log("Loaded chat order from localStorage, count:", order.length);
        return order;
      }
    } catch (error) {
      console.error("Error loading chat order from localStorage:", error);
    }
    const defaultOrder = Object.keys(allChats);
    console.log("Using default chat order, count:", defaultOrder.length);
    return defaultOrder;
  });

  // For auto-scrolling the chat container
  const chatContainerRef = React.useRef(null);

  // The messages for the currently selected chat - IMPROVED
  const currentMessages = React.useMemo(() => {
    if (!currentChatId || !allChats[currentChatId]?.messages) {
      console.log("No current messages - currentChatId:", currentChatId);
      return [];
    }
    console.log("Current messages count:", allChats[currentChatId].messages.length);
    return allChats[currentChatId].messages;
  }, [currentChatId, allChats]);
    
  // ========== PRO FEATURES ==========
  
  // Typing animation
  const [useTypingAnimation, setUseTypingAnimation] = React.useState(() => {
    return localStorage.getItem('useTypingAnimation') === 'true';
  });
  
  
  // Chat sharing
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
  const [sharableLink, setSharableLink] = React.useState('');
  
  // ========== FIREBASE AUTH HELPERS ==========
  
  // Listen for auth state changes
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsInitializing(false);
      
      if (firebaseUser) {
        console.log("User logged in:", firebaseUser.email);
        toast.success(`Welcome back, ${firebaseUser.email}!`);
        syncChatsFromFirebase(firebaseUser.uid);
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  // Sign up new user
  const handleSignUp = async (email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  };
  
  // Login existing user
  const handleLogin = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  };
  
  // Logout user
  const handleLogout = async () => {
    await signOut(auth);
    toast.info('Logged out successfully');
    setUser(null);
  };
  
  // Sync chats with Firebase
  const syncChatsToFirebase = async () => {
    if (!user) return;
    
    try {
      console.log("Syncing chats to Firebase");
      
      // Get user's organization ID
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      const orgId = userData?.organizationId;
      
      if (orgId) {
        // Organization chats path
        const orgChatsRef = collection(db, 'organizations', orgId, 'chats');
        
        // Upload each chat
        for (const chatId in allChats) {
          const chatDocRef = doc(orgChatsRef, chatId);
          await setDoc(chatDocRef, {
            ...allChats[chatId],
            organizationId: orgId // Add organization ID
          });
        }
        
        // Store chat order and folders in organization settings
        await setDoc(doc(db, 'organizations', orgId, 'settings', 'chats'), {
          order: chatOrder,
          folders: folders
        });
      } else {
        // User chats (backward compatibility for users without org)
        const userChatsRef = collection(db, 'users', user.uid, 'chats');
        
        for (const chatId in allChats) {
          const chatDocRef = doc(userChatsRef, chatId);
          await setDoc(chatDocRef, allChats[chatId]);
        }
        
        // Store chat order
        await setDoc(doc(db, 'users', user.uid, 'settings', 'chatOrder'), {
          order: chatOrder
        });
        
        // Store folders
        await setDoc(doc(db, 'users', user.uid, 'settings', 'folders'), {
          folders: folders
        });
      }
      
      console.log("Sync to Firebase completed");
      toast.success('All chats synchronized to cloud storage!');
    } catch (error) {
      console.error('Error syncing to Firebase:', error);
      toast.error('Failed to sync chats to cloud: ' + error.message);
    }
  };
  
  // Pull chats from Firebase
  const syncChatsFromFirebase = async (userId) => {
    try {
      setIsLoading(true);
      console.log("Syncing chats from Firebase for user:", userId);
      toast.info('Syncing your chats from the cloud...');
      
      // Check if userId is provided
      if (!userId) {
        console.warn("No user ID provided to syncChatsFromFirebase");
        toast.error('Error: No user ID available. Please log in again.');
        setIsLoading(false);
        return;
      }
      
      // First check if the user document exists
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        console.log("User document doesn't exist. Creating a basic user profile...");
        
        // Get user information from Auth
        const auth = getAuth();
        const currentUser = auth.currentUser;
        
        // If we can get the current user from auth, create a basic profile
        if (currentUser) {
          await setDoc(userDocRef, {
            name: currentUser.displayName || '',
            email: currentUser.email || '',
            role: 'user',
            status: 'active',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            organizationId: null // No organization by default
          });
          
          // Fetch the document again now that we've created it
          const newUserDoc = await getDoc(userDocRef);
          if (newUserDoc.exists()) {
            // Continue with the original function but with empty data (new user)
            toast.success('Created new user profile.');
            setIsLoading(false);
            return;
          } else {
            throw new Error("Failed to create user document");
          }
        } else {
          throw new Error("User authentication data not available");
        }
      }
      
      // Proceed with the original function as the user document exists
      const userData = userDoc.data();
      const orgId = userData?.organizationId;
      
      // If user belongs to an organization, get organization chats
      if (orgId) {
        console.log("User belongs to organization:", orgId);
        
        try {
          // Verify the organization exists
          const orgDocRef = doc(db, 'organizations', orgId);
          const orgDoc = await getDoc(orgDocRef);
          
          if (!orgDoc.exists()) {
            // Organization doesn't exist but user thinks they belong to it
            console.error(`Organization ${orgId} not found but user is linked to it`);
            toast.error('Organization not found. Please contact support.');
            
            // Reset the user's organization ID
            await updateDoc(userDocRef, {
              organizationId: null,
              updatedAt: new Date().toISOString()
            });
            
            // Proceed as if user has no organization
            throw new Error('Organization not found');
          }
          
          // Organization exists, proceed to fetch data
          // Get chat order from organization settings
          const settingsDocRef = doc(db, 'organizations', orgId, 'settings', 'chats');
          const settingsDoc = await getDoc(settingsDocRef);
          
          if (settingsDoc.exists()) {
            const settingsData = settingsDoc.data();
            if (settingsData.order && Array.isArray(settingsData.order)) {
              console.log("Loaded chat order from Firebase organization, count:", settingsData.order.length);
              setChatOrder(settingsData.order);
            }
            
            if (settingsData.folders && Array.isArray(settingsData.folders)) {
              console.log("Loaded folders from Firebase organization, count:", settingsData.folders.length);
              setFolders(settingsData.folders);
            }
          }
          
          // Get organization chats
          const orgChatsRef = collection(db, 'organizations', orgId, 'chats');
          const chatsSnapshot = await getDocs(orgChatsRef);
          
          const chats = {};
          chatsSnapshot.forEach((doc) => {
            chats[doc.id] = doc.data();
          });
          
          // Update local state if there are chats
          if (Object.keys(chats).length > 0) {
            console.log("Loaded chats from Firebase organization, count:", Object.keys(chats).length);
            setAllChats(chats);
            toast.success(`Loaded ${Object.keys(chats).length} chats from cloud storage`);
          } else {
            console.log("No organization chats found in Firebase");
          }
        } catch (orgError) {
          console.error("Error fetching organization data:", orgError);
          // Fall back to personal chats
          await fetchPersonalChats(userId);
        }
      } else {
        // User has no organization, load personal chats
        await fetchPersonalChats(userId);
      }
    } catch (error) {
      console.error('Error syncing from Firebase:', error);
      toast.error('Failed to load chats from cloud: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to fetch personal chats (extracted for reuse)
  const fetchPersonalChats = async (userId) => {
    console.log("Loading personal chats for user:", userId);
    
    try {
      // Get chat order
      const orderDocRef = doc(db, 'users', userId, 'settings', 'chatOrder');
      const orderDoc = await getDoc(orderDocRef);
      
      if (orderDoc.exists()) {
        const orderData = orderDoc.data();
        if (orderData.order && Array.isArray(orderData.order)) {
          console.log("Loaded chat order from Firebase, count:", orderData.order.length);
          setChatOrder(orderData.order);
        }
      }
      
      // Get folders
      const foldersDocRef = doc(db, 'users', userId, 'settings', 'folders');
      const foldersDoc = await getDoc(foldersDocRef);
      
      if (foldersDoc.exists()) {
        const foldersData = foldersDoc.data();
        if (foldersData.folders && Array.isArray(foldersData.folders)) {
          console.log("Loaded folders from Firebase, count:", foldersData.folders.length);
          setFolders(foldersData.folders);
        }
      }
      
      // Get user's personal chats
      const userChatsRef = collection(db, 'users', userId, 'chats');
      const querySnapshot = await getDocs(userChatsRef);
      
      const chats = {};
      querySnapshot.forEach((doc) => {
        chats[doc.id] = doc.data();
      });
      
      // Update local state if there are chats
      if (Object.keys(chats).length > 0) {
        console.log("Loaded chats from Firebase, count:", Object.keys(chats).length);
        setAllChats(chats);
        toast.success(`Loaded ${Object.keys(chats).length} chats from cloud storage`);
      } else {
        console.log("No personal chats found in Firebase");
      }
    } catch (error) {
      console.error('Error fetching personal chats:', error);
      throw error; // Re-throw to be handled by the caller
    }
  };

  // ========== HELPERS ==========
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };
  
  // Folder management
  const createFolder = (name) => {
    const newFolder = {
      id: Date.now().toString(),
      name: name
    };
    
    setFolders([...folders, newFolder]);
  };
  
  const deleteFolder = (folderId) => {
    // Remove folder from list
    setFolders(folders.filter(f => f.id !== folderId));
    
    // Update any chats that were in this folder
    const updatedChats = { ...allChats };
    
    Object.keys(updatedChats).forEach(chatId => {
      if (updatedChats[chatId].folderId === folderId) {
        updatedChats[chatId] = {
          ...updatedChats[chatId],
          folderId: null
        };
      }
    });
    
    setAllChats(updatedChats);
  };
  
  const moveToFolder = (chatId, folderId) => {
    setAllChats({
      ...allChats,
      [chatId]: {
        ...allChats[chatId],
        folderId: folderId,
        lastUpdated: new Date().toISOString()
      }
    });
  };
  
  // Tag management
  const handleTagSelect = (tag) => {
    if (tag === null) {
      // Clear selections
      setSelectedTags([]);
    } else if (selectedTags.includes(tag)) {
      // Remove tag
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      // Add tag
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  // Move chat in the order list (for drag and drop)
  const moveChat = (dragIndex, hoverIndex) => {
    const draggedChat = chatOrder[dragIndex];
    const newChatOrder = [...chatOrder];
    newChatOrder.splice(dragIndex, 1);
    newChatOrder.splice(hoverIndex, 0, draggedChat);
    setChatOrder(newChatOrder);
  };
  
  // Update the messages array for the current chat - IMPROVED
  const setMessagesForCurrentChat = (updatedMessages) => {
    if (!currentChatId) {
      console.warn("Cannot update messages: No chat selected");
      return;
    }
    
    console.log("Updating messages for chat:", currentChatId, "count:", updatedMessages.length);
    
    // Create a copy of the current chat with updated messages
    const updatedChat = {
      ...allChats[currentChatId],
      messages: updatedMessages,
      lastUpdated: new Date().toISOString()
    };
    
    // Create a copy of all chats with the updated chat
    const updatedAllChats = {
      ...allChats,
      [currentChatId]: updatedChat
    };
    
    // Update state
    setAllChats(updatedAllChats);
  };

  // Create a brand-new chat session
  const createNewChat = () => {
    const name = prompt('Enter chat name:');
    if (name === null) return; // User cancelled
    
    const tag = prompt('Enter tag (optional):');
    const id = Date.now().toString(); // unique ID

    const newChat = {
      id,
      name: name || `Chat ${Object.keys(allChats).length + 1}`,
      tag: tag || '',
      messages: [],
      folderId: selectedFolder, // Add to current folder if one is selected
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    console.log("Creating new chat:", id, name);
    
    // Add the new chat to allChats
    setAllChats((prev) => ({ ...prev, [id]: newChat }));
    
    // Add to the chat order list
    setChatOrder(prev => [id, ...prev]);
    
    // Make this the active chat
    setCurrentChatId(id);
    
    // Clear the input box
    setInput('');
    
    toast.success(`Chat "${name || `New Chat`}" created!`);
  };

  // Rename a chat
  const renameChat = (chatId) => {
    if (!allChats[chatId]) return;
    
    const currentName = allChats[chatId].name;
    const newName = prompt('Enter new name:', currentName);
    
    if (newName === null || newName === currentName) return; // User cancelled or no change
    
    console.log("Renaming chat:", chatId, "from:", currentName, "to:", newName);
    
    const updatedChat = {
      ...allChats[chatId],
      name: newName,
      lastUpdated: new Date().toISOString()
    };
    
    setAllChats({
      ...allChats,
      [chatId]: updatedChat
    });
    
    toast.success(`Chat renamed to "${newName}"`);
  };
  
  // Edit a chat's tag
  const editChatTag = (chatId, newTag) => {
    if (!allChats[chatId]) return;
    
    console.log("Updating tag for chat:", chatId, "new tag:", newTag);
    
    const updatedChat = {
      ...allChats[chatId],
      tag: newTag,
      lastUpdated: new Date().toISOString()
    };
    
    setAllChats({
      ...allChats,
      [chatId]: updatedChat
    });
  };
  
  // Delete a chat
  const deleteChat = (chatId) => {
    if (!allChats[chatId]) return;
    
    if (!confirm(`Are you sure you want to delete "${allChats[chatId].name}"?`)) {
      return; // User cancelled
    }
    
    console.log("Deleting chat:", chatId, allChats[chatId].name);
    
    const updatedChats = { ...allChats };
    delete updatedChats[chatId];
    setAllChats(updatedChats);
    
    // Remove from chat order
    setChatOrder(prev => prev.filter(id => id !== chatId));
    
    // If we're deleting the current chat, select another one or none
    if (chatId === currentChatId) {
      const remainingIds = Object.keys(updatedChats);
      setCurrentChatId(remainingIds.length > 0 ? remainingIds[0] : null);
    }
    
    toast.success(`Chat "${allChats[chatId].name}" deleted`);
    
    // Also delete from Firebase if user is logged in
    if (user) {
      deleteDoc(doc(db, 'users', user.uid, 'chats', chatId))
        .catch(error => {
          console.error('Error deleting from Firebase:', error);
          toast.error('Error deleting from cloud storage');
        });
    }
  };
  
  // Export all chats as JSON file
  const exportAllChats = () => {
    const dataStr = JSON.stringify(allChats, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `dental-assistant-chats_${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Chats exported successfully!');
  };
  
  // Import chats from a JSON file
  const importChatsFromJson = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedChats = JSON.parse(e.target.result);
        if (typeof importedChats !== 'object') throw new Error('Invalid format');
        
        console.log("Importing chats, count:", Object.keys(importedChats).length);
        
        // Merge with existing chats, newer imported chats take precedence
        const mergedChats = { ...allChats, ...importedChats };
        setAllChats(mergedChats);
        
        // Update chat order to include all chats
        const allIds = Object.keys(mergedChats);
        setChatOrder(prev => {
          const newOrder = [...prev];
          allIds.forEach(id => {
            if (!newOrder.includes(id)) {
              newOrder.push(id);
            }
          });
          return newOrder;
        });
        
        toast.success(`Successfully imported ${Object.keys(importedChats).length} chats.`);
      } catch (error) {
        console.error('Import error:', error);
        toast.error('Error importing chats. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };
  
  // ========== PRO FEATURES IMPLEMENTATION ==========
  
  // Toggle typing animation
  const toggleTypingAnimation = () => {
    setUseTypingAnimation(prev => !prev);
  };
  
  // Speech recognition result handler
  const handleSpeechResult = (transcript) => {
    setInput(prev => prev + ' ' + transcript);
  };
  
  // Generate a shareable link for a chat
  const shareChat = async (chatId) => {
    if (!user) {
      toast.error('You need to be logged in to share chats');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Create a unique share ID
      const shareId = CryptoJS.SHA256(chatId + Date.now()).toString().substring(0, 12);
      
      // Update the chat to mark it as shared
      const updatedChat = {
        ...allChats[chatId],
        shared: true,
        shareId: shareId,
        lastUpdated: new Date().toISOString()
      };
      
      // Update local state
      setAllChats({
        ...allChats,
        [chatId]: updatedChat
      });
      
      // Create a separate document in a 'shared' collection that anyone can access
      await setDoc(doc(db, 'shared', shareId), {
        chat: updatedChat,
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
        readOnly: true
      });
      
      // Update user's chat in Firebase
      await updateDoc(doc(db, 'users', user.uid, 'chats', chatId), updatedChat);
      
      // Generate shareable link
      const baseUrl = window.location.origin;
      const shareLink = `${baseUrl}/shared/${shareId}`;
      
      setSharableLink(shareLink);
      setIsShareModalOpen(true);
      
      toast.success('Chat shared successfully!');
    } catch (error) {
      console.error('Error sharing chat:', error);
      toast.error('Failed to share chat: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Copy the shareable link to clipboard
  const copyShareableLink = () => {
    navigator.clipboard.writeText(sharableLink)
      .then(() => {
        toast.success('Link copied to clipboard!');
      })
      .catch((error) => {
        console.error('Error copying link:', error);
        toast.error('Failed to copy link: ' + error.message);
      });
  };

  // ========== PERSISTENCE ==========

  // Save allChats to localStorage whenever it changes
  React.useEffect(() => {
    try {
      console.log("Saving chats to localStorage, count:", Object.keys(allChats).length);
      localStorage.setItem('dentalChats', JSON.stringify(allChats));
      
      // Extract all unique tags for the tag filter
      const tags = new Set();
      Object.values(allChats).forEach(chat => {
        if (chat.tag) tags.add(chat.tag);
      });
      setAllTags(Array.from(tags));
      
      // If user is logged in, sync to Firebase
      if (user) {
        // Don't wait for this to complete
        syncChatsToFirebase();
      }
    } catch (error) {
      console.error("Error saving chats to localStorage:", error);
      toast.error("Error saving chat data: " + error.message);
    }
  }, [allChats]);

  // Save the currentChatId so we remember which chat is selected
  React.useEffect(() => {
    console.log("Saving currentChatId to localStorage:", currentChatId);
    localStorage.setItem('currentChatId', currentChatId || '');
  }, [currentChatId]);
  
  // Save chat order
  React.useEffect(() => {
    try {
      console.log("Saving chat order to localStorage, count:", chatOrder.length);
      localStorage.setItem('chatOrder', JSON.stringify(chatOrder));
      
      // Sync to Firebase if user is logged in
      if (user) {
        setDoc(doc(db, 'users', user.uid, 'settings', 'chatOrder'), {
          order: chatOrder
        }).catch(error => {
          console.error("Error saving chat order to Firebase:", error);
        });
      }
    } catch (error) {
      console.error("Error saving chat order to localStorage:", error);
    }
  }, [chatOrder]);
  
  // Save folders
  React.useEffect(() => {
    try {
      console.log("Saving folders to localStorage, count:", folders.length);
      localStorage.setItem('dentalFolders', JSON.stringify(folders));
      
      // Sync to Firebase if user is logged in
      if (user) {
        setDoc(doc(db, 'users', user.uid, 'settings', 'folders'), {
          folders: folders
        }).catch(error => {
          console.error("Error saving folders to Firebase:", error);
        });
      }
    } catch (error) {
      console.error("Error saving folders to localStorage:", error);
    }
  }, [folders]);
  
  // Save dark mode preference
  React.useEffect(() => {
    localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  
  // Save typing animation preference
  React.useEffect(() => {
    localStorage.setItem('useTypingAnimation', useTypingAnimation.toString());
  }, [useTypingAnimation]);

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [currentMessages]);

  // Reset chat summary when changing chats
  React.useEffect(() => {
    setChatSummary('');
  }, [currentChatId]);
  
  // Close sidebar when selecting a chat on mobile
  React.useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [currentChatId]);

  // Generate a summary of the current chat
  const generateChatSummary = async () => {
    if (!currentChatId || !allChats[currentChatId]) return;
    
    setIsGeneratingSummary(true);
    
    try {
      const messages = allChats[currentChatId].messages;
      
      if (messages.length < 2) {
        setChatSummary('Not enough messages to generate a summary.');
        toast.info('Need at least 2 messages to generate a summary');
        return;
      }
      
      // Prepare conversation for summary
      const conversationText = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => `${msg.role === 'user' ? 'Patient' : 'Assistant'}: ${msg.content}`)
        .join('\n\n');
      
      // Call your backend summary endpoint
      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conversation: conversationText })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error?.message || `API error (${response.status})`);
      }
      
      const data = await response.json();
      setChatSummary(data.summary);
      toast.success('Summary generated successfully');
    } catch (error) {
      console.error('Summary generation error:', error);
      setChatSummary('Unable to generate summary. Please try again.');
      toast.error('Failed to generate summary: ' + error.message);
    } finally {
      setIsGeneratingSummary(false);
    }
  };
  
  const exportChatToPDF = () => {
    if (!currentChatId || !allChats[currentChatId]) return;
    
    try {
      const currentChat = allChats[currentChatId];
      const messages = currentChat.messages.filter(msg => msg.role !== 'system');
      
      // Create new PDF document
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Add title
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 128); // Dark blue color for title
      doc.text(currentChat.name, pageWidth / 2, 20, { align: "center" });
      
      // Add date and tag if available
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100); // Gray for metadata
      const dateStr = new Date().toLocaleDateString();
      doc.text(`Date: ${dateStr}`, 20, 30);
      
      if (currentChat.tag) {
        doc.text(`Tag: ${currentChat.tag}`, pageWidth - 20, 30, { align: "right" });
      }
      
      // Add a divider line
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 35, pageWidth - 20, 35);
      
      // Initialize starting y position for content
      let yPos = 45;
      
      // Check if we should create a new page
      const checkForNewPage = (height) => {
        if (yPos + height > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          
          // Add header to new page
          doc.setFontSize(10);
          doc.setTextColor(150, 150, 150);
          doc.text(currentChat.name, pageWidth / 2, 10, { align: "center" });
          doc.line(20, 15, pageWidth - 20, 15);
          
          // Reset y position for new page
          yPos = 25;
          return true;
        }
        return false;
      };
      
      // Add messages
      doc.setFontSize(11);
      
      messages.forEach((msg, index) => {
        // Prepare message content
        const isUser = msg.role === 'user';
        const speaker = isUser ? 'You' : 'Assistant';
        const messageText = msg.content;
        const timestamp = msg.timestamp ? new Date(msg.timestamp).toLocaleString() : '';
        
        // Set text color based on role
        if (isUser) {
          doc.setTextColor(0, 0, 0); // Black for user
        } else {
          doc.setTextColor(0, 100, 0); // Green for assistant
        }
        
        // Draw message with autotable for better text wrapping
        checkForNewPage(20); // Check if we need a new page
        
        // Add speaker name
        doc.setFont(undefined, 'bold');
        doc.text(`${speaker}:`, 20, yPos);
        doc.setFont(undefined, 'normal');
        
        // Calculate how much space the message will take
        const splitText = doc.splitTextToSize(messageText, pageWidth - 45);
        const textHeight = splitText.length * 7; // Approx 7pt per line
        
        // Check if need new page for the message
        checkForNewPage(textHeight);
        
        // Add message with light background for assistant
        if (!isUser) {
          doc.setFillColor(240, 250, 240); // Light green background for assistant
          doc.rect(18, yPos + 2, pageWidth - 36, textHeight + 6 + (timestamp ? 5 : 0), 'F');
        }
        
        // Add the message text
        doc.text(splitText, 25, yPos + 7);
        
        // Add timestamp if available
        if (timestamp) {
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(timestamp, pageWidth - 30, yPos + textHeight + 7, { align: "right" });
          doc.setFontSize(11);
          if (isUser) {
            doc.setTextColor(0, 0, 0);
          } else {
            doc.setTextColor(0, 100, 0);
          }
        }
        
        // Update y position
        yPos += textHeight + 15 + (timestamp ? 5 : 0);
        
        // Add small separation between messages
        if (index < messages.length - 1) {
          doc.setDrawColor(240, 240, 240);
          checkForNewPage(5);
          doc.line(30, yPos - 5, pageWidth - 30, yPos - 5);
        }
      });
      
      // Add footer with page numbers
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 20, doc.internal.pageSize.getHeight() - 10, { align: "right" });
        doc.text('AI Dental Assistant Chat Export', 20, doc.internal.pageSize.getHeight() - 10);
      }
      
      // Save the PDF
      doc.save(`${currentChat.name.replace(/\s+/g, '_')}_${dateStr.replace(/\//g, '-')}.pdf`);
      
      toast.success('Chat exported to PDF successfully');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF: ' + error.message);
    }
  };
  
  // ========== GPT LOGIC ==========

  // IMPROVED handleSend function that uses the backend API
  const handleSend = async () => {
    // 1. Check that there is non-empty input
    if (!input.trim()) return;
  
    // 2. Check that a chat is selected
    if (!currentChatId) {
      toast.error("Please create or select a chat first.");
      return;
    }
  
    // 3. Indicate loading state
    setIsLoading(true);
  
    // 4. Build the user's message and update the local state
    const userMessage = { 
      role: 'user', 
      content: input.trim(),
      timestamp: new Date().toISOString() 
    };
  
    // Append userMessage to the array of current messages
    const updatedMessages = [...currentMessages, userMessage];
    setMessagesForCurrentChat(updatedMessages);
    
    // Clear the input field in the UI
    setInput('');
  
    try {
      // Call your backend API instead of OpenAI directly
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API error (${response.status})`);
      }
  
      const data = await response.json();
  
      // Check if we got a valid response with choices
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Invalid response format from API");
      }
  
      // Add the AI's reply to our messages
      const aiReply = {
        role: 'assistant',
        content: data.choices[0].message.content,
        timestamp: new Date().toISOString(),
      };
      
      // Update the state with the AI's message
      const messagesWithReply = [...updatedMessages, aiReply];
      setMessagesForCurrentChat(messagesWithReply);
      
      // Update the lastUpdated timestamp for the chat
      const chatUpdate = {
        ...allChats[currentChatId],
        messages: messagesWithReply,
        lastUpdated: new Date().toISOString()
      };
      
      setAllChats({
        ...allChats,
        [currentChatId]: chatUpdate
      });
      
    } catch (error) {
      console.error('Error calling API:', error);
      
      // Create an error message
      const errorMessage = { 
        role: 'assistant', 
        content: `Error: ${error.message || 'An issue occurred while getting a reply.'}`,
        timestamp: new Date().toISOString()
      };
      
      // Add error message to chat
      setMessagesForCurrentChat([...updatedMessages, errorMessage]);
      
      // Show a toast with the error
      toast.error(`API Error: ${error.message}`);
  
    } finally {
      // Stop loading state
      setIsLoading(false);
    }
  };

  // Send on Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  // ========== UI ==========

  // Apply filters to chats
  const filteredAndSortedChats = chatOrder
    .filter(id => allChats[id])
    .filter(id => {
      const chat = allChats[id];
      
      // Filter by folder if selected
      if (selectedFolder !== null && chat.folderId !== selectedFolder) {
        return false;
      }
      
      // Filter by selected tags
      if (selectedTags.length > 0) {
        if (!chat.tag || !selectedTags.includes(chat.tag)) {
          return false;
        }
      }
      
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        
        // Search in name, tag, and content
        return (
          chat.name.toLowerCase().includes(searchLower) ||
          (chat.tag && chat.tag.toLowerCase().includes(searchLower)) ||
          chat.messages.some(msg => msg.content.toLowerCase().includes(searchLower))
        );
      }
      
      return true;
    })
    .map(id => allChats[id]);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Loading AI Dental Assistant</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`flex flex-col min-h-screen ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-100'}`}>
        {/* Toast container */}
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={isDarkMode ? "dark" : "light"}
        />
        
        {/* Chat Sharing Modal */}
        <ShareModal 
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          sharableLink={sharableLink}
          onCopyLink={copyShareableLink}
        />
        
        {/* Mobile header with hamburger menu */}
        <div className={`md:hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 border-b flex justify-between items-center`}>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`${isDarkMode ? 'text-white' : 'text-gray-700'} hover:${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-blue-700 dark:text-blue-400">AI Dental Assistant</h1>
          
          {/* Dark mode toggle for mobile */}
          <button 
            onClick={toggleDarkMode}
            className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            {isDarkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* ========== LEFT SIDEBAR ========== */}
          <div 
            className={`${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } md:translate-x-0 fixed md:static left-0 top-0 md:top-auto h-full z-40 w-64 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 border-r overflow-y-auto transition-transform duration-300 ease-in-out`}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold flex items-center">
                Chats
                <span className="ml-2 text-xs bg-purple-600 text-white px-2 py-0.5 rounded">PRO</span>
              </h2>
              
              {/* Dark mode toggle for desktop */}
              <button 
                onClick={toggleDarkMode}
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white md:block hidden"
              >
                {isDarkMode ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* Authentication component */}
            <AuthComponent 
              user={user}
              onLogin={handleLogin}
              onSignUp={handleSignUp}
              onLogout={handleLogout}
            />

            <button
              onClick={createNewChat}
              className="w-full mb-4 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              + New Chat
            </button>
            
            {/* Import/Export buttons */}
            <div className="flex mb-4 space-x-2">
              <label className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 text-center cursor-pointer">
                <input
                  type="file"
                  accept=".json"
                  onChange={importChatsFromJson}
                  className="hidden"
                />
                Import
              </label>
              <button
                onClick={exportAllChats}
                className="flex-1 bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
              >
                Export
              </button>
            </div>
            
            {/* Pro Features Controls */}
            <div className="mb-4 p-3 border rounded dark:border-gray-700">
              <h3 className="text-sm font-bold mb-2 flex items-center">
                Pro Features <ProBadge />
              </h3>
              
              <div className="flex items-center mb-2">
                <input
                  id="typing-animation"
                  type="checkbox"
                  checked={useTypingAnimation}
                  onChange={toggleTypingAnimation}
                  className="mr-2"
                />
                <label htmlFor="typing-animation" className="text-sm">
                  Enable typing animation
                </label>
              </div>
            </div>
            
            {/* Folder system */}
            <FolderSystem 
              folders={folders}
              onCreateFolder={createFolder}
              onDeleteFolder={deleteFolder}
              onSelectFolder={setSelectedFolder}
              selectedFolder={selectedFolder}
              allTags={allTags}
              selectedTags={selectedTags}
              onTagSelect={handleTagSelect}
            />
            
            {/* Search input */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full p-2 border rounded ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
              />
            </div>

            {filteredAndSortedChats.length === 0 && (
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {Object.values(allChats).length === 0 
                  ? "No chats yet." 
                  : "No chats match your search."}
              </p>
            )}

            {filteredAndSortedChats.map((chat, index) => (
              <ChatCard 
                key={chat.id}
                chat={chat}
                isActive={currentChatId === chat.id}
                onSelect={setCurrentChatId}
                onRename={renameChat}
                onTagEdit={editChatTag}
                onDelete={deleteChat}
                onMoveToFolder={moveToFolder}
                folders={folders}
                index={index}
                moveChat={moveChat}
                onShareChat={shareChat}
              />
            ))}
          </div>

          {/* Backdrop for mobile sidebar */}
          {isSidebarOpen && (
            <div 
              className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
              onClick={() => setIsSidebarOpen(false)}
            ></div>
          )}

          {/* ========== MAIN CHAT AREA ========== */}
          <div className={`flex flex-col flex-1 p-4 overflow-hidden ${isDarkMode ? 'bg-gray-900' : ''}`}>
            <div className="hidden md:flex justify-between items-center mb-2">
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-700'} flex items-center`}>
                AI Dental Assistant <ProBadge />
              </h1>
              
              {currentChatId && currentMessages.length > 0 && (
                <div className="flex space-x-2">
                  <button
                    onClick={generateChatSummary}
                    disabled={isGeneratingSummary}
                    className={`${
                      isGeneratingSummary 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : isDarkMode ? 'bg-green-700 hover:bg-green-800' : 'bg-green-600 hover:bg-green-700'
                    } text-white px-4 py-2 rounded flex items-center`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {isGeneratingSummary ? 'Summarizing...' : 'Summarize'}
                  </button>

                  <button
                    onClick={exportChatToPDF}
                    className={`${isDarkMode ? 'bg-indigo-700 hover:bg-indigo-800' : 'bg-indigo-600 hover:bg-indigo-700'} text-white px-4 py-2 rounded flex items-center`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export PDF
                  </button>
                </div>
              )}
            </div>

            {currentChatId ? (
              <>
                {/* Chat Summary */}
                {chatSummary && (
                  <div className={`${isDarkMode ? 'bg-yellow-900 border-yellow-800' : 'bg-yellow-50 border-yellow-400'} border-l-4 p-4 mb-4 rounded`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className={`font-semibold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-800'} mb-1`}>Summary</h3>
                        <p className={`text-sm ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>{chatSummary}</p>
                      </div>
                      <button 
                        onClick={() => setChatSummary('')}
                        className={`${isDarkMode ? 'text-yellow-400 hover:text-yellow-300' : 'text-yellow-500 hover:text-yellow-700'}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* Mobile action buttons */}
                <div className="flex md:hidden space-x-2 mb-4">
                  {currentMessages.length > 0 && (
                    <>
                      <button
                        onClick={generateChatSummary}
                        disabled={isGeneratingSummary}
                        className={`flex-1 ${
                          isGeneratingSummary 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : isDarkMode ? 'bg-green-700 hover:bg-green-800' : 'bg-green-600 hover:bg-green-700'
                        } text-white py-2 rounded flex items-center justify-center`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {isGeneratingSummary ? 'Summarizing...' : 'Summarize'}
                      </button>

                      <button
                        onClick={exportChatToPDF}
                        className={`flex-1 ${isDarkMode ? 'bg-indigo-700 hover:bg-indigo-800' : 'bg-indigo-600 hover:bg-indigo-700'} text-white py-2 rounded flex items-center justify-center`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export PDF
                      </button>
                    </>
                  )}
                </div>

                {/* Chat Messages */}
                <div
                  ref={chatContainerRef}
                  className={`flex-1 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-4 overflow-y-auto mb-4 h-[60vh] md:h-[70vh]`}
                >
                  {currentMessages.length === 0 ? (
                    <div className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-8`}>
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    currentMessages
                      .filter((msg) => msg.role !== 'system')
                      .map((msg, index) => (
                        <Message 
                          key={index} 
                          message={msg} 
                          isDarkMode={isDarkMode}
                          typingAnimation={!msg.role === 'user' && useTypingAnimation} 
                        />
                      ))
                  )}
                  
                  {isLoading && (
                    <div className="text-left mb-2">
                      <div className={`inline-block px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <span className="animate-pulse">Thinking...</span>
                      </div>
                    </div>
                  )}
                </div>

             
                {/* Input + Send */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      className={`w-full p-2 border rounded ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask the assistant something..."
                      disabled={isLoading}
                    />
                   
                  </div>
                  {/* Speech Recognition component */}
                <EnhancedSpeechToText
                onTextResult={handleSpeechResult}
                 isDarkMode={isDarkMode}
                />
                  <button
                    className={`text-white px-4 py-2 rounded ${
                      isLoading || !input.trim()
                        ? 'bg-gray-400 cursor-not-allowed'
                        : isDarkMode ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                  >
                    {isLoading ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </>
            ) : (
              <div className={`text-gray-500 dark:text-gray-400 mt-12 text-center`}>
                <p>Select or create a chat to begin.</p>
                <button
                  onClick={createNewChat}
                  className={`mt-4 ${isDarkMode ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} text-white px-6 py-2 rounded`}
                >
                  Create Your First Chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DndProvider>
  );
}

export default App;