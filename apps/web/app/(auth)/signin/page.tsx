import { Suspense } from "react";
import SigninForm from "@/components/Signin";

export default function SigninPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <SigninForm />
    </Suspense>
  )
}
