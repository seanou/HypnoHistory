import { cn } from "@/lib/utils";

export function Logo({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-8 text-primary", className)}
      {...props}
    >
      <title>VisionaryAI Logo</title>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
      <path d="m15 9-1.5 1.5" />
      <path d="M17.5 6.5 16 8" />
      <path d="m9 9 1.5 1.5" />
      <path d="m6.5 6.5 1.5 1.5" />
    </svg>
  );
}
