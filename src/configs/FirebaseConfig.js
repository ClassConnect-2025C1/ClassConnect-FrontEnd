import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBd6mNdGlptYkb_sDbEl8wZBiQhuntwUac',
  authDomain: 'loginclassconnect.firebaseapp.com',
  projectId: 'loginclassconnect',
  storageBucket: 'loginclassconnect.appspot.com',
  messagingSenderId: '98403984467',
  appId: '1:98403984467:web:9ff498a7b1534908b1d2a6',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
