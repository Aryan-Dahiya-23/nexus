import { Loader2 } from "lucide-react";

interface LoadingIndicatorProps {
  size?: "sm" | "default" | "lg";
  className?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ size = "default", className = "" }) => {
  const sizeClasses = {
    sm: "h-5 w-5",
    default: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`relative flex items-center justify-center ${className}`}
    >
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary stroke-[2.5]`} />
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingIndicator;
