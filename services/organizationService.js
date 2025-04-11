// services/organizationService.js
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { createOrganizationObject } from '../models/Organization';

// Assuming you have an encryption utility like the one in App.jsx
const encryptData = (data) => {
  const CryptoJS = window.CryptoJS || require('crypto-js');
  const ENCRYPTION_KEY = "AI_DENTAL_ASSISTANT_SECRET_KEY";
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
};

const db = getFirestore();

/**
 * Create a new organization and associate the creator as owner
 */
export const createOrganization = async (name, userId, userEmail, planType = 'basic') => {
  try {
    // Create organization reference with auto-ID
    const orgRef = doc(collection(db, 'organizations'));
    const orgId = orgRef.id;
    
    // Create organization object
    const orgData = createOrganizationObject(
      name,
      userId,
      userEmail,
      planType
    );
    
    // Save to Firestore
    await setDoc(orgRef, orgData);
    
    // Update user's profile to link them to this organization as owner
    await updateDoc(doc(db, 'users', userId), {
      organizationId: orgId,
      role: 'owner',
      updatedAt: new Date().toISOString()
    });
    
    return {
      id: orgId,
      ...orgData
    };
  } catch (error) {
    console.error('Error creating organization:', error);
    throw error;
  }
};

/**
 * Get an organization by ID
 */
export const getOrganization = async (orgId) => {
  try {
    const orgDoc = await getDoc(doc(db, 'organizations', orgId));
    
    if (!orgDoc.exists()) {
      throw new Error('Organization not found');
    }
    
    return {
      id: orgDoc.id,
      ...orgDoc.data()
    };
  } catch (error) {
    console.error('Error getting organization:', error);
    throw error;
  }
};

/**
 * Update organization settings
 */
export const updateOrganization = async (orgId, updateData) => {
  try {
    // Ensure sensitive data is encrypted if present
    if (updateData?.settings?.apiSettings?.apiKey) {
      updateData.settings.apiSettings.apiKey = encryptData(
        updateData.settings.apiSettings.apiKey
      );
    }
    
    // Add updatedAt timestamp
    const dataToUpdate = {
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(doc(db, 'organizations', orgId), dataToUpdate);
    
    return true;
  } catch (error) {
    console.error('Error updating organization:', error);
    throw error;
  }
};

/**
 * Get all users in an organization
 */
export const getOrganizationUsers = async (orgId) => {
  try {
    const usersQuery = query(
      collection(db, 'users'),
      where('organizationId', '==', orgId)
    );
    
    const querySnapshot = await getDocs(usersQuery);
    const users = [];
    
    querySnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return users;
  } catch (error) {
    console.error('Error getting organization users:', error);
    throw error;
  }
};

/**
 * Invite a user to an organization
 */
export const inviteUserToOrganization = async (orgId, email, role = 'user') => {
  try {
    // Create an invitation
    const inviteRef = doc(collection(db, 'invitations'));
    
    await setDoc(inviteRef, {
      email,
      organizationId: orgId,
      role,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
    });
    
    // In a real implementation, you would send an email here
    
    return {
      id: inviteRef.id,
      email,
      status: 'pending'
    };
  } catch (error) {
    console.error('Error inviting user:', error);
    throw error;
  }
};