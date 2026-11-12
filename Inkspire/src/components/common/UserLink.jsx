import { Link } from 'react-router-dom';
import { getId } from '../../utils/api';

function UserLink({ user, children, className = '' }) {
  const userId = getId(user);

  if (!userId) {
    return children;
  }

  return (
    <Link
      to={`/users/${encodeURIComponent(userId)}`}
      state={{
        profileUser: {
          _id: userId,
          firstName: user.firstName,
          lastName: user.lastName,
          image: user.image,
          createdAt: user.createdAt,
        },
      }}
      className={`hover:text-coral ${className}`}
    >
      {children}
    </Link>
  );
}

export default UserLink;
