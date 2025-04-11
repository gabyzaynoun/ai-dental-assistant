import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  setDoc,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';

// User Role Badge Component
const RoleBadge = ({ role }) => {
  const colors = {
    admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    owner: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    practitioner: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    assistant: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[role] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
      {role || 'user'}
    </span>
  );
};

// Plan Badge Component
const PlanBadge = ({ plan }) => {
  const colors = {
    free: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    basic: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    professional: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    practice: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    enterprise: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[plan] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
      {plan || 'free'}
    </span>
  );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const colors = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    trial: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    suspended: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    canceled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
      {status || 'unknown'}
    </span>
  );
};

// Statistic Card Component
const StatCard = ({ title, value, icon, description, trend, trendValue }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div className="flex justify-between items-start">
      <div>
        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
      </div>
      <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
        {icon}
      </div>
    </div>
    <div className="mt-2">
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      {trend && (
        <p className={`text-sm mt-1 ${trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {trend === 'up' ? '↑' : '↓'} {trendValue}
        </p>
      )}
    </div>
  </div>
);

// User Edit Modal Component
const UserEditModal = ({ isOpen, onClose, user, onSave }) => {
  const [editedUser, setEditedUser] = useState(user);
  
  useEffect(() => {
    setEditedUser(user);
  }, [user]);
  
  if (!isOpen) return null;
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(editedUser);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edit User</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={editedUser.email}
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={editedUser.name || ''}
                  onChange={(e) => setEditedUser({...editedUser, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={editedUser.role || 'user'}
                  onChange={(e) => setEditedUser({...editedUser, role: e.target.value})}
                >
                  <option value="user">User</option>
                  <option value="assistant">Assistant</option>
                  <option value="practitioner">Practitioner</option>
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Plan
                </label>
                <select
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={editedUser.plan || 'free'}
                  onChange={(e) => setEditedUser({...editedUser, plan: e.target.value})}
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="professional">Professional</option>
                  <option value="practice">Practice</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={editedUser.status || 'active'}
                  onChange={(e) => setEditedUser({...editedUser, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="trial">Trial</option>
                  <option value="suspended">Suspended</option>
                  <option value="canceled">Canceled</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Organization Settings Component
const OrganizationSettings = ({ organization, onUpdate }) => {
  const [orgData, setOrgData] = useState(organization || {
    name: '',
    logo: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    maxUsers: 5
  });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(orgData);
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Organization Settings</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Organization Name
            </label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              value={orgData.name}
              onChange={(e) => setOrgData({...orgData, name: e.target.value})}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              value={orgData.email}
              onChange={(e) => setOrgData({...orgData, email: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone
            </label>
            <input
              type="tel"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              value={orgData.phone}
              onChange={(e) => setOrgData({...orgData, phone: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Website
            </label>
            <input
              type="url"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              value={orgData.website}
              onChange={(e) => setOrgData({...orgData, website: e.target.value})}
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Address
            </label>
            <textarea
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              value={orgData.address}
              onChange={(e) => setOrgData({...orgData, address: e.target.value})}
              rows="3"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Maximum Users
            </label>
            <input
              type="number"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              value={orgData.maxUsers}
              onChange={(e) => setOrgData({...orgData, maxUsers: parseInt(e.target.value)})}
              min="1"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Logo URL
            </label>
            <input
              type="url"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              value={orgData.logo}
              onChange={(e) => setOrgData({...orgData, logo: e.target.value})}
            />
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

// API Key Management Component
const ApiKeyManagement = () => {
  const [apiKeys, setApiKeys] = useState([
    {
      id: 'default',
      name: 'OpenAI API Key',
      type: 'openai',
      key: '••••••••••••••••••••••••••',
      lastUsed: new Date(),
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    }
  ]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [newKeyType, setNewKeyType] = useState('openai');
  const [isAddingKey, setIsAddingKey] = useState(false);
  
  const handleAddKey = () => {
    if (newKeyName && newKeyValue) {
      const newKey = {
        id: Date.now().toString(),
        name: newKeyName,
        type: newKeyType,
        key: newKeyValue.substring(0, 3) + '••••••••••••••••••••••••••',
        createdAt: new Date(),
        lastUsed: null
      };
      
      setApiKeys([...apiKeys, newKey]);
      setNewKeyName('');
      setNewKeyValue('');
      setIsAddingKey(false);
      
      // In a real app, you would save the encrypted key to your database
      // Here we're just simulating the UI
    }
  };
  
  const handleDeleteKey = (id) => {
    if (window.confirm('Are you sure you want to delete this API key?')) {
      setApiKeys(apiKeys.filter(key => key.id !== id));
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">API Key Management</h2>
        <button
          onClick={() => setIsAddingKey(true)}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Key
        </button>
      </div>
      
      {isAddingKey && (
        <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
          <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">Add New API Key</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Key Name
              </label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g., Production OpenAI Key"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Key Type
              </label>
              <select
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={newKeyType}
                onChange={(e) => setNewKeyType(e.target.value)}
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="azure">Azure OpenAI</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                API Key
              </label>
              <input
                type="password"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={newKeyValue}
                onChange={(e) => setNewKeyValue(e.target.value)}
                placeholder="sk-..."
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsAddingKey(false)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddKey}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={!newKeyName || !newKeyValue}
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Key</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Used</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {apiKeys.map((apiKey) => (
              <tr key={apiKey.id}>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{apiKey.name}</td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                    {apiKey.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 font-mono">{apiKey.key}</td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  {apiKey.createdAt.toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  {apiKey.lastUsed ? apiKey.lastUsed.toLocaleDateString() : 'Never'}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <button
                    onClick={() => handleDeleteKey(apiKey.id)}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        <p>API keys are encrypted before being stored. For security, keys are never displayed in full.</p>
      </div>
    </div>
  );
};

// Usage Stats Component
const UsageStats = () => {
  // This would be fetched from your backend in a real application
  const usageData = {
    apiCalls: 12487,
    messagesProcessed: 52349,
    tokensGenerated: 3845621,
    activeUsers: 243,
    costToDate: 126.83,
  };
  
  const chartData = [
    { date: '2025-03-01', calls: 320, tokens: 98000 },
    { date: '2025-03-02', calls: 350, tokens: 110000 },
    { date: '2025-03-03', calls: 410, tokens: 130000 },
    { date: '2025-03-04', calls: 390, tokens: 120000 },
    { date: '2025-03-05', calls: 450, tokens: 140000 },
    { date: '2025-03-06', calls: 420, tokens: 135000 },
    { date: '2025-03-07', calls: 480, tokens: 155000 },
  ];
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">API Usage Statistics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="API Calls" 
          value={usageData.apiCalls.toLocaleString()} 
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          description="Total API calls this month"
          trend="up"
          trendValue="12% from last month"
        />
        
        <StatCard 
          title="Tokens Generated" 
          value={(usageData.tokensGenerated / 1000).toLocaleString() + 'K'} 
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          }
          description="Total tokens generated this month"
          trend="up"
          trendValue="8% from last month"
        />
        
        <StatCard 
          title="Cost to Date" 
          value={`$${usageData.costToDate.toFixed(2)}`} 
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          description="API usage cost in April"
          trend="down"
          trendValue="5% from last month"
        />
      </div>
      
      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Daily Usage</h3>
        <div className="h-64 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          {/* This would be a chart in a real app */}
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400 text-center">
              [Chart visualization would be here - displaying API calls and token usage by day]<br/>
              For this example, we're using dummy data with 7 days of API calls and token usage.
            </p>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Usage by Model</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Model</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">API Calls</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tokens</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">gpt-3.5-turbo</td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">8,942</td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">2,845,621</td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">$56.91</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">gpt-4</td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">3,545</td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">1,000,000</td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">$69.92</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [organization, setOrganization] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('isDarkMode');
    return saved !== null ? JSON.parse(saved) : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  
  const db = getFirestore();
  const auth = getAuth();
  
  // Mock user data since we're not actually fetching from Firebase in this example
  useEffect(() => {
    const fetchUsers = async () => {
      // In a real app, you would fetch users from Firebase
      // For this example, we'll use mock data
      setUsers([
        {
          id: '1',
          email: 'dr.smith@dentalclinic.com',
          name: 'Dr. John Smith',
          role: 'owner',
          plan: 'practice',
          status: 'active',
          lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          chats: 148,
        },
        {
          id: '2',
          email: 'receptionist@dentalclinic.com',
          name: 'Sarah Johnson',
          role: 'assistant',
          plan: 'practice',
          status: 'active',
          lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000),
          chats: 97,
        },
        {
          id: '3',
          email: 'dr.wilson@dentalclinic.com',
          name: 'Dr. Emily Wilson',
          role: 'practitioner',
          plan: 'practice',
          status: 'active',
          lastLogin: new Date(),
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          chats: 212,
        },
        {
          id: '4',
          email: 'admin@company.com',
          name: 'Admin User',
          role: 'admin',
          plan: 'enterprise',
          status: 'active',
          lastLogin: new Date(Date.now() - 12 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
          chats: 54,
        },
        {
          id: '5',
          email: 'trial@example.com',
          name: 'Trial User',
          role: 'user',
          plan: 'professional',
          status: 'trial',
          lastLogin: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          chats: 23,
        },
      ]);
      
      setOrganization({
        name: 'Bright Smile Dental Clinic',
        logo: '',
        address: '123 Main St, Suite 200, Anytown, CA 12345',
        phone: '(555) 123-4567',
        email: 'contact@brightsmile.com',
        website: 'https://brightsmile.com',
        plan: 'practice',
        maxUsers: 10,
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      });
      
      setIsLoading(false);
    };
    
    fetchUsers();
  }, []);
  
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };
  
  const handleSaveUser = async (updatedUser) => {
    // In a real app, you would update the user in Firebase
    setUsers(users.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    ));
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };
  
  const handleUpdateOrganization = async (updatedOrg) => {
    // In a real app, you would update the organization in Firebase
    setOrganization(updatedOrg);
    alert('Organization settings updated successfully!');
  };
  
  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      // In a real app, you would delete the user from Firebase
      setUsers(users.filter(user => user.id !== userId));
    }
  };
  
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
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-100'}`}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <div>
                <h1 className="text-xl font-bold text-blue-700 dark:text-blue-400">AI Dental Assistant</h1>
                <div className="text-sm text-gray-600 dark:text-gray-400">Admin Panel</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
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
              
              <div className="flex items-center">
                <span className="mr-2 text-sm text-gray-600 dark:text-gray-400">Admin User</span>
                <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  A
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'dashboard'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'users'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'organization'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('organization')}
          >
            Organization
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'api-keys'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('api-keys')}
          >
            API Keys
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'usage'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('usage')}
          >
            Usage & Billing
          </button>
        </div>
        
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard 
                title="Total Users" 
                value={users.length.toString()} 
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
                description="Active accounts in your organization"
              />
              
              <StatCard 
                title="Total Chats" 
                value="534" 
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                }
                description="AI conversations this month"
                trend="up"
                trendValue="15% from last month"
              />
              
              <StatCard 
                title="Current Plan" 
                value="Practice" 
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
                description={`${organization.maxUsers} users allowed (${users.length} active)`}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">Dr. Emily Wilson</span> joined a new chat
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Today, 9:41 AM</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">Sarah Johnson</span> exported a chat to PDF
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Yesterday, 3:12 PM</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        API usage reached 80% of monthly limit
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Yesterday, 10:24 AM</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">Dr. John Smith</span> updated organization settings
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Apr 5, 2:39 PM</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Status</h2>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">API Health</span>
                      <span className="text-xs font-medium text-green-700 dark:text-green-300">Operational</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Database</span>
                      <span className="text-xs font-medium text-green-700 dark:text-green-300">Operational</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Storage</span>
                      <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">82% Used</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '82%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">User Quota</span>
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">{users.length}/{organization.maxUsers} Users</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(users.length / organization.maxUsers) * 100}%` }}></div>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Recent Updates</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      • System upgraded to v2.4.0 on Apr 6, 2025<br />
                      • Speech-to-text feature added on Apr 3, 2025<br />
                      • Security patches applied on Apr 1, 2025
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Manage Users</h2>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Invite User
              </button>
            </div>
            
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 md:space-x-4">
                <div className="flex-1 min-w-0">
                  <label htmlFor="search" className="sr-only">Search</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="search"
                      name="search"
                      id="search"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Search users by name or email..."
                    />
                  </div>
                </div>
                <div className="flex space-x-3">
                  <select className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white sm:text-sm">
                    <option value="">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="owner">Owner</option>
                    <option value="practitioner">Practitioner</option>
                    <option value="assistant">Assistant</option>
                    <option value="user">User</option>
                  </select>
                  <select className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white sm:text-sm">
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="trial">Trial</option>
                    <option value="suspended">Suspended</option>
                    <option value="canceled">Canceled</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Plan / Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Chats
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300 font-medium">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <PlanBadge plan={user.plan} />
                          <StatusBadge status={user.status} />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {user.lastLogin.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {user.chats}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-200 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{users.length}</span> of <span className="font-medium">{users.length}</span> results
                </p>
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 disabled:opacity-50">
                  Previous
                </button>
                <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 disabled:opacity-50">
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Organization Tab */}
        {activeTab === 'organization' && (
          <div className="space-y-6">
            <OrganizationSettings 
              organization={organization}
              onUpdate={handleUpdateOrganization}
            />
          </div>
        )}
        
        {/* API Keys Tab */}
        {activeTab === 'api-keys' && (
          <div className="space-y-6">
            <ApiKeyManagement />
          </div>
        )}
        
        {/* Usage Tab */}
        {activeTab === 'usage' && (
          <div className="space-y-6">
            <UsageStats />
          </div>
        )}
      </div>
      
      {/* User Edit Modal */}
      <UserEditModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={selectedUser || {}}
        onSave={handleSaveUser}
      />
    </div>
  );
};

export default AdminPanel;