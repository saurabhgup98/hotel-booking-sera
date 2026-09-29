import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <div className="px-4">
        <LoginForm />
      </div>
    </Suspense>
  );
}
