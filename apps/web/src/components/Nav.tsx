"use client"
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  VscHome,
  VscTerminal,
  VscAccount,
  VscSignOut,
  VscSignIn,
} from 'react-icons/vsc';

import Dock from './Dock';

const Nav = () => {
  const router = useRouter();
  const { data: session } = useSession();

  const items = [
    {
      icon: <VscHome size={20} />,
      label: 'Home',
      onClick: () => router.push('/home'),
    },
    {
      icon: <VscTerminal size={20} />,
      label: 'Control',
      onClick: () => router.push('/control'),
    },
    {
      icon: <VscAccount size={20} />,
      label: 'Profile',
      onClick: () => router.push('/home'),
    },
    session?.user
      ? {
          icon: <VscSignOut size={20} />,
          label: 'Logout',
          onClick: async () => {
            await signOut({ redirect: false });
            router.push('/api/auth/signin');
          },
        }
      : {
          icon: <VscSignIn size={20} />,
          label: 'Login',
          onClick: () => router.push('/api/auth/signin'),
        },
  ];


  return (
<>
      <Dock
        items={items}
        panelHeight={68}
        baseItemSize={50}
        magnification={72}
      />

</>
)
};

export default Nav;
