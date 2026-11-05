export default function Atmosphere() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-80 mix-blend-screen bg-[radial-gradient(90%_60%_at_76%_-8%,rgba(139,92,246,0.30),transparent_62%),radial-gradient(80%_55%_at_6%_2%,rgba(40,150,255,0.26),transparent_58%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-60 mix-blend-screen [background-image:linear-gradient(rgba(255,255,255,0.022)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.022)_1px,transparent_1px)] [background-size:68px_68px] [mask-image:radial-gradient(85%_65%_at_50%_0%,black,transparent)]"
      />
    </>
  );
}