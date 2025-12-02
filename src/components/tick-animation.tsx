
'use client';

export function TickAnimation() {
  return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 130.2 130.2"
      className="h-20 w-20"
    >
      <circle
        className="path circle"
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="6"
        strokeMiterlimit="10"
        cx="65.1"
        cy="65.1"
        r="62.1"
      />
      <polyline
        className="path check"
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="6"
        strokeLinecap="round"
        strokeMiterlimit="10"
        points="100.2,40.2 51.5,88.8 29.8,67.5 "
      />
      <style>{`
        .path {
          stroke-dasharray: 1000;
          stroke-dashoffset: 0;
        }
        .circle {
          animation: dash .9s ease-in-out;
        }
        .check {
          stroke-dashoffset: -100;
          animation: dash-check .9s .35s ease-in-out forwards;
        }
        @keyframes dash {
          0% { stroke-dashoffset: 1000; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes dash-check {
          0% { stroke-dashoffset: -100; }
          100% { stroke-dashoffset: 900; }
        }
      `}</style>
    </svg>
  );
}

    