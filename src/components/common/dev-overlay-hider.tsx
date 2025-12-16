"use client";

export default function DevOverlayHider() {
  if (process.env.NODE_ENV === 'production') return null;
  // Hide Next.js dev error overlay and toasts during demos
  return (
    <style suppressHydrationWarning>{`
      /* Hide Next.js dev overlay portals/toasts */
      .nextjs-portal, [data-nextjs-toast] { display: none !important; }
      #nextjs__container, #nextjs__container * { display: none !important; }
    `}</style>
  );
}


