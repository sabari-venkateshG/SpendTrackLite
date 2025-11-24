import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 14.59L12 15.17l-1.41 1.42L9.17 15.17l1.42-1.41-1.42-1.42 1.42-1.41 1.41 1.41 1.41-1.41 1.42 1.41-1.42 1.42 1.42 1.41-1.42 1.42z" />
      <path d="M14 10h-4v4" />
    </svg>
  );
}
