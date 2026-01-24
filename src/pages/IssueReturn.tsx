import { useState, useEffect } from "react";
import { BookOpen, BookCheck, Search, ArrowRight, Calendar, User, Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Book } from "@/components/BookCard";
import { useNavigate } from "react-router-dom";

interface FoundProfile {
  id: string;
  full_name: string;
  user_id: string;
}

const IssueReturn = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [issueBookCode, setIssueBookCode] = useState("");
  const [returnBookCode, setReturnBookCode] = useState("");
  const [usn, setUsn] = useState("");
  const [foundBook, setFoundBook] = useState<Book | null>(null);
  const [foundProfile, setFoundProfile] = useState<FoundProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchingBook, setIsSearchingBook] = useState(false);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Check if current user is admin
  useEffect(() => {
    const checkAdminRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase.rpc('has_role', {
        _user_id: session.user.id,
        _role: 'admin'
      });

      if (error || !data) {
        toast({
          title: "Access Denied",
          description: "Only administrators can access this page.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
    };

    checkAdminRole();
  }, [navigate, toast]);

  const handleSearchBook = async (code: string, type: "issue" | "return") => {
    if (!code.trim()) {
      toast({
        title: "Enter Book Code",
        description: "Please enter a book code to search.",
        variant: "destructive",
      });
      return;
    }

    setIsSearchingBook(true);
    setFoundBook(null);

    // Use type assertion for new table
    const { data, error } = await (supabase
      .from("books" as "profiles")
      .select("*")
      .ilike("code", code.trim())
      .maybeSingle() as unknown as Promise<{ data: Book | null; error: Error | null }>);

    setIsSearchingBook(false);

    if (error) {
      toast({
        title: "Search Error",
        description: "Could not search for the book.",
        variant: "destructive",
      });
      return;
    }
    
    if (data) {
      setFoundBook(data);
      if (type === "issue" && !data.available) {
        toast({
          title: "Book Unavailable",
          description: "This book is currently issued to another user.",
          variant: "destructive",
        });
      } else if (type === "return" && data.available) {
        toast({
          title: "Book Not Issued",
          description: "This book is not currently issued.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Book Not Found",
        description: "No book found with this code.",
        variant: "destructive",
      });
    }
  };

  const handleSearchUser = async () => {
    if (!usn.trim()) {
      toast({
        title: "Enter USN",
        description: "Please enter a user's USN to search.",
        variant: "destructive",
      });
      return;
    }

    setIsSearchingUser(true);
    setFoundProfile(null);

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, user_id")
      .ilike("usn", usn.trim())
      .maybeSingle();

    setIsSearchingUser(false);

    if (error) {
      toast({
        title: "Search Error",
        description: "Could not search for the user.",
        variant: "destructive",
      });
      return;
    }

    if (data) {
      setFoundProfile(data);
      toast({
        title: "User Found",
        description: `Found: ${data.full_name}`,
      });
    } else {
      toast({
        title: "User Not Found",
        description: "No user found with this USN.",
        variant: "destructive",
      });
    }
  };

  const handleIssueBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundBook || !foundBook.available || !foundProfile) return;

    setIsLoading(true);

    try {
      // Create transaction - use type assertion for new table
      const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      const { error: transactionError } = await supabase
        .from("book_transactions" as any)
        .insert([{
          book_id: foundBook.id,
          user_id: foundProfile.user_id,
          profile_id: foundProfile.id,
          type: "issue",
          issue_date: new Date().toISOString(),
          due_date: dueDate.toISOString(),
        }]);

      if (transactionError) throw transactionError;

      // Update book availability
      const { error: bookError } = await supabase
        .from("books" as any)
        .update({ available: false })
        .eq("id", foundBook.id);

      if (bookError) throw bookError;

      toast({
        title: "Book Issued Successfully!",
        description: `"${foundBook.name}" has been issued to ${foundProfile.full_name}. Due date: ${dueDate.toLocaleDateString()}`,
      });

      setIssueBookCode("");
      setUsn("");
      setFoundBook(null);
      setFoundProfile(null);
    } catch {
      toast({
        title: "Error",
        description: "Could not issue the book. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturnBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundBook || foundBook.available) return;

    setIsLoading(true);

    try {
      // Find the active transaction for this book
      interface TransactionRecord {
        id: string;
        user_id: string;
        profile_id: string;
        issue_date: string;
        due_date: string | null;
      }
      
      const { data: transaction, error: findError } = await (supabase
        .from("book_transactions" as any)
        .select("*")
        .eq("book_id", foundBook.id)
        .eq("type", "issue")
        .is("return_date", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()) as { data: TransactionRecord | null; error: any };

      if (findError) throw findError;

      if (transaction) {
        // Create return transaction
        const { error: transactionError } = await supabase
          .from("book_transactions" as any)
          .insert([{
            book_id: foundBook.id,
            user_id: transaction.user_id,
            profile_id: transaction.profile_id,
            type: "return",
            issue_date: transaction.issue_date,
            due_date: transaction.due_date,
            return_date: new Date().toISOString(),
          }]);

        if (transactionError) throw transactionError;

        // Update the original issue transaction with return date
        await supabase
          .from("book_transactions" as any)
          .update({ return_date: new Date().toISOString() })
          .eq("id", transaction.id);
      }

      // Update book availability
      const { error: bookError } = await supabase
        .from("books" as any)
        .update({ available: true })
        .eq("id", foundBook.id);

      if (bookError) throw bookError;

      toast({
        title: "Book Returned Successfully!",
        description: `"${foundBook.name}" has been returned. Thank you!`,
      });

      setReturnBookCode("");
      setFoundBook(null);
    } catch {
      toast({
        title: "Error",
        description: "Could not return the book. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
                  {/* User USN */}
                  <div className="space-y-2">
                    <Label htmlFor="usn">User USN</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="usn"
                          type="text"
                          placeholder="Enter USN (e.g., 1XX21CS001)"
                          value={usn}
                          onChange={(e) => {
                            setUsn(e.target.value.toUpperCase());
                            setFoundProfile(null);
                          }}
                          className="pl-10 uppercase"
                          required
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSearchUser}
                        disabled={isSearchingUser}
                      >
                        {isSearchingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : "Find"}
                      </Button>
                    </div>
                    {foundProfile && (
                      <p className="text-sm text-green-600 dark:text-green-400">✓ {foundProfile.full_name}</p>
                    )}
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
                            setIssueBookCode(e.target.value.toUpperCase());
                            setFoundBook(null);
                          }}
                          className="pl-10 uppercase"
                          required
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleSearchBook(issueBookCode, "issue")}
                        disabled={isSearchingBook}
                      >
                        {isSearchingBook ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
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
                    disabled={isLoading || !foundBook?.available || !foundProfile}
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
                            setReturnBookCode(e.target.value.toUpperCase());
                            setFoundBook(null);
                          }}
                          className="pl-10 uppercase"
                          required
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleSearchBook(returnBookCode, "return")}
                        disabled={isSearchingBook}
                      >
                        {isSearchingBook ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
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
                    disabled={isLoading || !foundBook || foundBook.available}
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
