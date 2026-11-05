export default function VisualShell({ children, className = "" }) {
  return (
    <div
      className={`relative aspect-[4/3] w-full overflow-hidden rounded-[26px] border border-white/10 bg-[#060810] shadow-[0_50px_140px_-50px_rgba(0,0,0,0.95)] ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_18%_0%,rgba(53,224,255,0.14),transparent_62%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_80%_at_100%_100%,rgba(139,92,246,0.14),transparent_60%)]" />
      {children}
    </div>
  );
}