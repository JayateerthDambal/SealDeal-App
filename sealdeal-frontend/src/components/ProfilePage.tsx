import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { type UserProfile } from '../types';

const ProfilePage = () => {
    const [user] = useAuthState(auth);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            const unsubscribe = onSnapshot(userDocRef, (doc) => {
                if (doc.exists()) {
                    setUserProfile(doc.data() as UserProfile);
                }
                setLoading(false);
            });
            return () => unsubscribe();
        } else {
            setLoading(false);
        }
    }, [user]);

    if (loading) {
        return <div>Loading profile...</div>;
    }

    if (!userProfile) {
        return <div>Could not load user profile. Please sign up again to create a profile.</div>;
    }

    return (
        <div style={{ fontFamily: 'sans-serif', maxWidth: '800px', margin: '2rem auto', padding: '2rem', background: '#f9f9f9', borderRadius: '8px' }}>
            <h2>User Profile</h2>
            <p><strong>Email:</strong> {userProfile.email}</p>
            <p><strong>User ID:</strong> {userProfile.uid}</p>
            <p><strong>Role:</strong> <span style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{userProfile.role}</span></p>
        </div>
    );
};

export default ProfilePage;

