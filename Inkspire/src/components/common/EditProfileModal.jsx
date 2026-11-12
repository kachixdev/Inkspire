import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import Avatar from './Avatar';
import { apiRequest, getImageUrl } from '../../utils/api';

const sections = [
  { id: 'name', label: 'Edit name' },
  { id: 'email', label: 'Edit email' },
  { id: 'password', label: 'Change password' },
];

function EditProfileModal({ user, onClose, onSave }) {
  const [activeSection, setActiveSection] = useState('name');
  const [form, setForm] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(
    user.image ? getImageUrl(user.image) : '',
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (avatarPreview.startsWith('blob:')) {
      return () => URL.revokeObjectURL(avatarPreview);
    }
  }, [avatarPreview]);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function selectAvatar(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Avatar image must be smaller than 5 MB.');
      event.target.value = '';
      return;
    }

    setError('');
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function saveProfile(event) {
    event.preventDefault();
    setError('');

    if (activeSection === 'password') {
      if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
        setError('Fill in all three password fields to change your password.');
        return;
      }

      if (form.newPassword !== form.confirmPassword) {
        setError('The new passwords do not match.');
        return;
      }

      if (form.newPassword.length < 8) {
        setError('Your new password must be at least 8 characters.');
        return;
      }
    }

    const formData = new FormData();
    if (activeSection === 'name') {
      formData.append('firstName', form.firstName);
      formData.append('lastName', form.lastName);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }
    } else if (activeSection === 'email') {
      formData.append('email', form.email);
    } else {
      formData.append('currentPassword', form.currentPassword);
      formData.append('newPassword', form.newPassword);
    }

    setSaving(true);
    try {
      const response = await apiRequest('/users/profile', {
        method: 'PATCH',
        body: formData,
      });

      if (!response.user) {
        throw new Error('The server did not return your updated profile.');
      }

      localStorage.setItem('currentUser', JSON.stringify(response.user));
      window.dispatchEvent(new Event('auth-change'));
      onSave(response.user);
    } catch (requestError) {
      console.error('Error updating profile:', requestError);
      setError(requestError.message || 'Could not update your profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-title"
    >
      <form
        onSubmit={saveProfile}
        className="my-auto w-full max-w-lg rounded-2xl bg-paper p-5 shadow-xl sm:p-7"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 id="edit-profile-title" className="text-2xl font-bold">
              Edit profile
            </h2>
            <p className="mt-1 text-sm text-ink/55">
              Choose what you want to update.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-ink/50 hover:bg-mist hover:text-ink"
            aria-label="Close edit profile"
          >
            <X size={20} />
          </button>
        </div>

        <div
          className="mt-6 flex border-b border-ink/10"
          role="tablist"
          aria-label="Profile settings"
        >
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              role="tab"
              aria-selected={activeSection === section.id}
              onClick={() => {
                setActiveSection(section.id);
                setError('');
              }}
              className={`border-b-2 px-3 py-3 text-xs font-semibold transition-colors sm:px-4 sm:text-sm ${
                activeSection === section.id
                  ? 'border-ink text-ink'
                  : 'border-transparent text-ink/50 hover:text-ink'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>

        {activeSection === 'name' && (
          <div className="mt-5 space-y-5">
            <div className="flex flex-wrap items-center gap-4 rounded-xl bg-mist/60 p-4">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile avatar preview"
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <Avatar user={user} size="lg" />
              )}
              <label className="cursor-pointer rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold hover:bg-paper">
                {avatarFile ? 'Choose another photo' : 'Choose photo'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={selectAvatar}
                />
              </label>
              <span className="text-xs text-ink/45">
                JPEG, PNG or WebP · Max 5 MB
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-first-name" className="label">First name</label>
                <input
                  id="edit-first-name"
                  name="firstName"
                  className="field"
                  value={form.firstName}
                  onChange={updateField}
                  required
                />
              </div>
              <div>
                <label htmlFor="edit-last-name" className="label">Last name</label>
                <input
                  id="edit-last-name"
                  name="lastName"
                  className="field"
                  value={form.lastName}
                  onChange={updateField}
                  required
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'email' && (
          <div className="mt-6">
            <label htmlFor="edit-email" className="label">Email</label>
            <input
              id="edit-email"
              name="email"
              type="email"
              className="field"
              value={form.email}
              onChange={updateField}
              required
            />
            <p className="mt-2 text-xs text-ink/50">
              This email address is used to sign in to your account.
            </p>
          </div>
        )}

        {activeSection === 'password' && (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-ink/55">
              Enter your current password, then choose a new one.
            </p>
            <div>
              <label htmlFor="current-password" className="label">
                Current password
              </label>
              <input
                id="current-password"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                className="field"
                value={form.currentPassword}
                onChange={updateField}
                required
              />
            </div>
            <div>
              <label htmlFor="new-password" className="label">New password</label>
              <input
                id="new-password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                className="field"
                value={form.newPassword}
                onChange={updateField}
                required
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="label">
                Retype new password
              </label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                className="field"
                value={form.confirmPassword}
                onChange={updateField}
                required
              />
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>
        )}
        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold hover:bg-mist"
            disabled={saving}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary py-2.5" disabled={saving}>
            {saving
              ? 'Saving...'
              : activeSection === 'password'
                ? 'Update password'
                : activeSection === 'email'
                  ? 'Save email'
                  : 'Save name'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditProfileModal;
