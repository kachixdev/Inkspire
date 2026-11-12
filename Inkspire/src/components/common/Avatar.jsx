import { getImageUrl } from '../../utils/api';

function Avatar({ user, size = 'md' }) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-20 w-20 text-xl' };
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`;

  if (user?.image) {
    return <img src={getImageUrl(user.image)} alt={`${user.firstName} ${user.lastName}`} className={`${sizes[size]} rounded-full object-cover`} />;
  }

  return (
    <div className={`${sizes[size]} grid shrink-0 place-items-center rounded-full bg-ink font-semibold text-white`}>
      {initials || '?'}
    </div>
  );
}

export default Avatar;
