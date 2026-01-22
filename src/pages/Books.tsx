import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, Grid, List, Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BookCard, Book } from "@/components/BookCard";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const categories = [
  "All",
  "Fiction",
  "Science",
  "Technology",
  "History",
  "Philosophy",
  "Arts",
  "Mathematics",
];

const Books = () => {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const { toast } = useToast();
  
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    const fetchBooks = async () => {
      setIsLoading(true);
      
      // Use type assertion since the types file may not be updated yet
      const { data, error } = await (supabase
        .from("books" as "profiles")
        .select("*")
        .order("code", { ascending: true }) as unknown as Promise<{ data: Book[] | null; error: Error | null }>);

      if (error) {
        toast({
          title: "Error loading books",
          description: "Could not fetch books from the database.",
          variant: "destructive",
        });
        setBooks([]);
      } else {
        setBooks(data || []);
      }
      setIsLoading(false);
    };

    fetchBooks();
  }, [toast]);

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesSearch =
        searchQuery === "" ||
        book.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" || book.category === selectedCategory;

      const matchesAvailability = !showAvailableOnly || book.available;

      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [books, searchQuery, selectedCategory, showAvailableOnly]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Header */}
      <section className="gradient-hero text-primary-foreground py-12">
        <div className="container">
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">
            Books Catalog
          </h1>
          <p className="text-primary-foreground/80">
            Browse our complete collection of books
          </p>
        </div>
      </section>

      {/* Filters & Search */}
      <section className="py-6 border-b border-border bg-card sticky top-16 z-40">
        <div className="container">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="w-full lg:w-96">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search books..."
              />
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "rounded-full",
                    selectedCategory === category &&
                      "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* View Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAvailableOnly(!showAvailableOnly)}
                className={cn(
                  "gap-2",
                  showAvailableOnly && "bg-success/10 text-success border-success"
                )}
              >
                <Filter className="h-4 w-4" />
                Available Only
              </Button>
              <div className="flex border rounded-md overflow-hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "rounded-none h-9 w-9",
                    viewMode === "grid" && "bg-muted"
                  )}
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "rounded-none h-9 w-9",
                    viewMode === "list" && "bg-muted"
                  )}
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-8 flex-1">
        <div className="container">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading books...</span>
            </div>
          ) : (
            <>
              {/* Results count */}
              <div className="flex items-center gap-2 mb-6">
                <span className="text-muted-foreground">
                  Showing {filteredBooks.length} of {books.length} books
                </span>
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    "{searchQuery}"
                    <button
                      onClick={() => setSearchQuery("")}
                      className="ml-1 hover:text-foreground"
                    >
                      ×
                    </button>
                  </Badge>
                )}
              </div>

              {/* Books Grid/List */}
              {filteredBooks.length > 0 ? (
                viewMode === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredBooks.map((book, index) => (
                      <div
                        key={book.id}
                        className="animate-fade-up"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <BookCard book={book} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredBooks.map((book, index) => (
                      <div
                        key={book.id}
                        className="flex items-center gap-4 p-4 bg-card rounded-lg shadow-card hover:shadow-card-hover transition-all animate-fade-up"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="w-12 h-16 bg-primary/10 rounded flex items-center justify-center">
                          <span className="font-mono text-xs text-primary">{book.code}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-serif font-bold text-foreground truncate">
                            {book.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            by {book.author}
                          </p>
                        </div>
                        <Badge variant="outline">{book.category}</Badge>
                        <Badge
                          className={cn(
                            book.available ? "status-available" : "status-issued"
                          )}
                        >
                          {book.available ? "Available" : "Issued"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="text-center py-16">
                  <p className="text-muted-foreground text-lg">
                    No books found matching your criteria.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("All");
                      setShowAvailableOnly(false);
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Books;
