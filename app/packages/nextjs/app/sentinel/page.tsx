"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SentinelRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting to dashboard...</p>
    </div>
  );
}
