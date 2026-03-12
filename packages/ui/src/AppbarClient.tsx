"use client"
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from '@repo/ui/Navbar'

const AppbarClient = () => {
  const session = useSession();
  const router = useRouter();

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
