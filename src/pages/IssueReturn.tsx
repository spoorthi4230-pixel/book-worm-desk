import { useState } from "react";
import { BookOpen, BookCheck, Search, ArrowRight, Calendar, User } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { mockBooks } from "@/data/mockBooks";
import { cn } from "@/lib/utils";

const IssueReturn = () => {
  const { toast } = useToast();
  const [issueBookCode, setIssueBookCode] = useState("");
  const [returnBookCode, setReturnBookCode] = useState("");
  const [userId, setUserId] = useState("");
  const [foundBook, setFoundBook] = useState<typeof mockBooks[0] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearchBook = (code: string, type: "issue" | "return") => {
    const book = mockBooks.find(
      (b) => b.code.toLowerCase() === code.toLowerCase()
    );
    
    if (book) {
      setFoundBook(book);
      if (type === "issue" && !book.available) {
        toast({
          title: "Book Unavailable",
          description: "This book is currently issued to another user.",
          variant: "destructive",
        });
      }
    } else {
      setFoundBook(null);
      toast({
        title: "Book Not Found",
        description: "No book found with this code.",
        variant: "destructive",
      });
    }
  };

  const handleIssueBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundBook || !foundBook.available) return;

    setIsLoading(true);
    setTimeout(() => {
      toast({
        title: "Book Issued Successfully!",
        description: `"${foundBook.name}" has been issued. Due date: ${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}`,
      });
      setIsLoading(false);
      setIssueBookCode("");
      setUserId("");
      setFoundBook(null);
    }, 1500);
  };

  const handleReturnBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundBook) return;

    setIsLoading(true);
    setTimeout(() => {
      toast({
        title: "Book Returned Successfully!",
        description: `"${foundBook.name}" has been returned. Thank you!`,
      });
      setIsLoading(false);
      setReturnBookCode("");
      setFoundBook(null);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Header */}
      <section className="gradient-hero text-primary-foreground py-12">
        <div className="container">
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">
            Issue & Return Books
          </h1>
          <p className="text-primary-foreground/80">
            Manage book borrowing and returns
          </p>
        </div>
      </section>

      <section className="flex-1 py-12">
        <div className="container max-w-2xl">
          <Tabs defaultValue="issue" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="issue" className="gap-2 text-base py-3">
                <BookOpen className="h-5 w-5" />
                Issue Book
              </TabsTrigger>
              <TabsTrigger value="return" className="gap-2 text-base py-3">
                <BookCheck className="h-5 w-5" />
                Return Book
              </TabsTrigger>
            </TabsList>

            {/* Issue Book Tab */}
            <TabsContent value="issue">
              <div className="bg-card rounded-xl shadow-lg p-6 lg:p-8 border border-border">
                <form onSubmit={handleIssueBook} className="space-y-6">
                  {/* User ID */}
                  <div className="space-y-2">
                    <Label htmlFor="userId">User ID</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="userId"
                        type="text"
                        placeholder="Enter your User ID (e.g., USR1234)"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {/* Book Code */}
                  <div className="space-y-2">
                    <Label htmlFor="issueBookCode">Book Code</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="issueBookCode"
                          type="text"
                          placeholder="Enter Book Code (e.g., LIB001)"
                          value={issueBookCode}
                          onChange={(e) => {
                            setIssueBookCode(e.target.value);
                            setFoundBook(null);
                          }}
                          className="pl-10"
                          required
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleSearchBook(issueBookCode, "issue")}
                      >
                        Search
                      </Button>
                    </div>
                  </div>

                  {/* Book Preview */}
                  {foundBook && (
                    <div className="p-4 rounded-lg border border-border bg-muted/30 animate-scale-in">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Badge variant="secondary" className="font-mono mb-2">
                            {foundBook.code}
                          </Badge>
                          <h3 className="font-serif font-bold text-foreground">
                            {foundBook.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            by {foundBook.author}
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            foundBook.available
                              ? "status-available"
                              : "status-issued"
                          )}
                        >
                          {foundBook.available ? "Available" : "Issued"}
                        </Badge>
                      </div>

                      {foundBook.available && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Due Date:{" "}
                              {new Date(
                                Date.now() + 14 * 24 * 60 * 60 * 1000
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full gap-2"
                    size="lg"
                    disabled={isLoading || !foundBook?.available || !userId}
                  >
                    {isLoading ? (
                      "Processing..."
                    ) : (
                      <>
                        Issue Book
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </TabsContent>

            {/* Return Book Tab */}
            <TabsContent value="return">
              <div className="bg-card rounded-xl shadow-lg p-6 lg:p-8 border border-border">
                <form onSubmit={handleReturnBook} className="space-y-6">
                  {/* Book Code */}
                  <div className="space-y-2">
                    <Label htmlFor="returnBookCode">Book Code</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="returnBookCode"
                          type="text"
                          placeholder="Enter Book Code (e.g., LIB001)"
                          value={returnBookCode}
                          onChange={(e) => {
                            setReturnBookCode(e.target.value);
                            setFoundBook(null);
                          }}
                          className="pl-10"
                          required
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleSearchBook(returnBookCode, "return")}
                      >
                        Search
                      </Button>
                    </div>
                  </div>

                  {/* Book Preview */}
                  {foundBook && (
                    <div className="p-4 rounded-lg border border-border bg-muted/30 animate-scale-in">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Badge variant="secondary" className="font-mono mb-2">
                            {foundBook.code}
                          </Badge>
                          <h3 className="font-serif font-bold text-foreground">
                            {foundBook.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            by {foundBook.author}
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            foundBook.available
                              ? "status-available"
                              : "status-issued"
                          )}
                        >
                          {foundBook.available ? "Available" : "Issued"}
                        </Badge>
                      </div>

                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Return Date: {new Date().toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full gap-2"
                    size="lg"
                    disabled={isLoading || !foundBook}
                  >
                    {isLoading ? (
                      "Processing..."
                    ) : (
                      <>
                        Return Book
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default IssueReturn;
