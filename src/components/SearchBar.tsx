import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: () => void;
  placeholder?: string;
  variant?: "default" | "hero";
}

export const SearchBar = ({
  value,
  onChange,
  onSearch,
  placeholder = "Search books by name, author, or code...",
  variant = "default",
}: SearchBarProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.();
  };

  if (variant === "hero") {
    return (
      <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
        <div className="relative flex items-center">
          <div className="absolute left-4 text-muted-foreground">
            <Search className="h-5 w-5" />
          </div>
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="pl-12 pr-28 h-14 text-base rounded-full border-2 border-border bg-background shadow-lg focus-visible:ring-accent focus-visible:border-accent"
          />
          <Button
            type="submit"
            className="absolute right-2 rounded-full h-10 px-6 gradient-accent text-accent-foreground hover:opacity-90"
          >
            Search
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex items-center">
        <div className="absolute left-3 text-muted-foreground">
          <Search className="h-4 w-4" />
        </div>
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-4 h-11"
        />
      </div>
    </form>
  );
};
