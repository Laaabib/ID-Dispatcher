import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { toast } from 'sonner';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const isPermissionDenied = errorMessage.toLowerCase().includes('permission-denied') || 
                            errorMessage.toLowerCase().includes('insufficient permissions');

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };

  console.error('Firestore Error: ', JSON.stringify(errInfo));

  // User-friendly messages
  let friendlyMessage = "An unexpected database error occurred.";
  
  if (isPermissionDenied) {
    friendlyMessage = `You don't have permission to ${operationType} data in ${path || 'this collection'}.`;
  } else if (errorMessage.includes('quota-exceeded')) {
    friendlyMessage = "Database quota exceeded. Please try again later.";
  } else if (errorMessage.includes('offline')) {
    friendlyMessage = "You appear to be offline. Please check your connection.";
  } else {
    friendlyMessage = `Failed to ${operationType} ${path || 'data'}. ${errorMessage}`;
  }

  toast.error(friendlyMessage);

  if (isPermissionDenied) {
    throw new Error(JSON.stringify(errInfo));
  }
  
  return errInfo;
}
