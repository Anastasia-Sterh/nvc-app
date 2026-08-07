export function WatercolorBackground() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-[#fff8f0]" />

      <div
        className="pointer-events-none absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full opacity-70 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, #ffe08a 0%, #ffd4a8 45%, transparent 70%)',
        }}
      />
      <div
        className="pointer-events-none absolute -right-16 top-1/4 h-[380px] w-[380px] rounded-full opacity-60 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, #ffc9b5 0%, #ffb8c9 50%, transparent 72%)',
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/3 h-[360px] w-[360px] rounded-full opacity-55 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, #ffd6e8 0%, #ffe4c4 55%, transparent 75%)',
        }}
      />
    </>
  )
}
