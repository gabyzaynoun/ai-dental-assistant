export const ORGANIZATION_TYPES = {
  SOLO_PRACTICE: 'solo_practice',
  GROUP_PRACTICE: 'group_practice',
  DSO: 'dso', // Dental Service Organization
  HOSPITAL: 'hospital',
  EDUCATIONAL: 'educational',
  OTHER: 'other'
};

// Organization Status
export const ORGANIZATION_STATUS = {
  ACTIVE: 'active',
  TRIAL: 'trial',
  SUSPENDED: 'suspended',
  DEACTIVATED: 'deactivated'
};

/**
 * Creates a new organization object
 */
export const createOrganizationObject = (
  name,
  ownerId,
  email,
  planType = 'basic',
  type = ORGANIZATION_TYPES.SOLO_PRACTICE
) => {
  return {
    name,
    ownerId,
    email,
    type,
    planType,
    status: ORGANIZATION_STATUS.TRIAL,
    maxUsers: getPlanMaxUsers(planType),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
    settings: {
      theme: 'auto',
      branding: {
        logo: null,
        primaryColor: '#3b82f6', // Tailwind blue-500
        useBranding: false
      },
      features: {
        shareLinks: true,
        templates: true,
        voiceInput: true,
        exportPdf: true,
        customApiKey: false
      },
      apiSettings: {
        useOrgApiKey: false,
        apiKey: null, // Will be encrypted if provided
        model: 'gpt-3.5-turbo'
      }
    },
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    phone: '',
    website: ''
  };
};

/**
 * Get maximum number of users based on plan type
 */
export const getPlanMaxUsers = (planType) => {
  switch (planType) {
    case 'basic':
      return 2;
    case 'professional':
      return 5;
    case 'practice':
      return 15;
    case 'enterprise':
      return 100;
    default:
      return 1;
  }
};