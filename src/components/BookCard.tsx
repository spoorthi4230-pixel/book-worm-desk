import { Book as BookIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface Book {
  id: string;
  code: string;
  name: string;
  author: string;
  category: string;
  available: boolean;
  coverColor?: string;
}

interface BookCardProps {
  book: Book;
  onClick?: () => void;
}

const categoryColors: Record<string, string> = {
  "Fiction": "bg-blue-500/10 text-blue-700 border-blue-200",
  "Science": "bg-green-500/10 text-green-700 border-green-200",
  "History": "bg-amber-500/10 text-amber-700 border-amber-200",
  "Technology": "bg-purple-500/10 text-purple-700 border-purple-200",
  "Philosophy": "bg-rose-500/10 text-rose-700 border-rose-200",
  "Arts": "bg-pink-500/10 text-pink-700 border-pink-200",
  "Mathematics": "bg-cyan-500/10 text-cyan-700 border-cyan-200",
};

const bookCoverColors = [
  "from-primary to-primary/80",
  "from-accent to-amber-600",
  "from-emerald-600 to-emerald-700",
  "from-rose-600 to-rose-700",
  "from-violet-600 to-violet-700",
  "from-cyan-600 to-cyan-700",
];

export const BookCard = ({ book, onClick }: BookCardProps) => {
  const coverColor = book.coverColor || bookCoverColors[parseInt(book.id) % bookCoverColors.length];
  const categoryColor = categoryColors[book.category] || "bg-muted text-muted-foreground";

  return (
    <div
      onClick={onClick}
      className="book-card cursor-pointer overflow-hidden group"
    >
      {/* Book Cover */}
      <div className={cn(
        "relative h-48 bg-gradient-to-br flex items-center justify-center",
        coverColor
      )}>
        <BookIcon className="h-16 w-16 text-white/30" />
        <div className="absolute bottom-3 left-3 right-3">
          <Badge 
            variant="secondary" 
            className="text-xs font-mono bg-white/90 text-foreground"
          >
            {book.code}
          </Badge>
        </div>
      </div>

      {/* Book Details */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-serif font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {book.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            by {book.author}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <Badge variant="outline" className={cn("text-xs", categoryColor)}>
            {book.category}
          </Badge>
          <Badge
            className={cn(
              "text-xs",
              book.available ? "status-available" : "status-issued"
            )}
          >
            {book.available ? "Available" : "Issued"}
          </Badge>
        </div>
      </div>
    </div>
  );
};
