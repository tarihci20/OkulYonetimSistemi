import { cn } from "@/lib/utils";

interface StatusCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  description?: string;
  color?: "primary" | "warning" | "error" | "success" | "info";
}

export function StatusCard({
  icon,
  title,
  value,
  description,
  color = "primary",
}: StatusCardProps) {
  const bgColorMap = {
    primary: "bg-primary bg-opacity-5",
    warning: "bg-warning bg-opacity-5",
    error: "bg-error bg-opacity-5", 
    success: "bg-success bg-opacity-5",
    info: "bg-info bg-opacity-5",
  };
  
  const textColorMap = {
    primary: "text-primary",
    warning: "text-warning",
    error: "text-error",
    success: "text-success",
    info: "text-info",
  };

  return (
    <div className={cn("rounded-md p-4", bgColorMap[color])}>
      <div className="flex items-center">
        <span className={cn("mr-2", textColorMap[color])}>{icon}</span>
        <h4 className="font-medium">{title}</h4>
      </div>
      <div className="text-3xl font-bold my-2">{value}</div>
      {description && <div className="text-sm text-neutral-500">{description}</div>}
    </div>
  );
}
