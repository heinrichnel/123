import React from 'react';
import { useSyncedState } from '../hooks/useSyncedState';

interface ProfileFormProps {
  userId: string;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ userId }) => {
  const [profileName, setProfileName] = useSyncedState('profileName', userId);

  return (
    <form>
      <label>
        Name:
        <input
          value={profileName}
          onChange={e => setProfileName(e.target.value)}
          placeholder="Enter your name"
        />
      </label>
      <p className="text-xs text-gray-500 mt-2">
        Name is saved in localStorage and Firestore.
      </p>
    </form>
  );
};

export default ProfileForm;