"use client"
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Navbar from './Navbar';

const AppbarClient = () => {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Hide the navbar on these specific pages
  const hideNavbarPages = ["/signin", "/signup"];
  const shouldHideNavbar = hideNavbarPages.includes(pathname);

  if (shouldHideNavbar) {
    return null;
  }

  return (
   <div>
      <Navbar onSignin={signIn} onSignout={async () => {
        await signOut()
        router.push("/api/auth/signin")
      }} user={session.data?.user} />
   </div>
  );
}
export { AppbarClient };
