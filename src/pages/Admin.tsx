import { useState, useEffect } from "react";
import {
  Book,
  Users,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Search,
  BookCheck,
  BarChart3,
  Loader2,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Book as BookType } from "@/components/BookCard";

const categories = [
  "Fiction",
  "Science",
  "Technology",
  "History",
  "Philosophy",
  "Arts",
  "Mathematics",
];

interface Profile {
  id: string;
  full_name: string;
  email: string;
  usn: string;
  phone: string | null;
  photo_id_status: string | null;
}

interface Transaction {
  id: string;
  book_id: string;
  user_id: string;
  profile_id: string;
  type: string;
  issue_date: string;
  due_date: string | null;
  return_date: string | null;
  created_at: string;
  book_code?: string;
  book_name?: string;
  user_name?: string;
  user_usn?: string;
}

const Admin = () => {
  const { toast } = useToast();
  const [books, setBooks] = useState<BookType[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newBook, setNewBook] = useState({
    name: "",
    author: "",
    category: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    
    // Fetch books - use type assertion for new table
    const { data: booksData } = await (supabase
      .from("books" as "profiles")
      .select("*")
      .order("code", { ascending: true }) as unknown as Promise<{ data: BookType[] | null; error: Error | null }>);
    
    // Fetch users (profiles)
    const { data: usersData } = await supabase
      .from("profiles")
      .select("id, full_name, email, usn, phone, photo_id_status")
      .order("created_at", { ascending: false });
    
    // Fetch transactions - simplified approach, fetch separately and join in memory
    interface RawTransaction {
      id: string;
      book_id: string;
      user_id: string;
      profile_id: string;
      type: string;
      issue_date: string;
      due_date: string | null;
      return_date: string | null;
      created_at: string;
    }
    
    const { data: transactionsData } = await (supabase
      .from("book_transactions" as "profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50) as unknown as Promise<{ data: RawTransaction[] | null; error: Error | null }>);

    // Enrich transactions with book and user info
    const enrichedTransactions: Transaction[] = (transactionsData || []).map(tx => {
      const book = booksData?.find(b => b.id === tx.book_id);
      const user = usersData?.find(u => u.id === tx.profile_id);
      return {
        ...tx,
        book_code: book?.code,
        book_name: book?.name,
        user_name: user?.full_name,
        user_usn: user?.usn,
      };
    });

    setBooks(booksData || []);
    setUsers(usersData || []);
    setTransactions(enrichedTransactions);
    setIsLoading(false);
  };

  const generateBookCode = async () => {
    const { data } = await (supabase
      .from("books" as "profiles")
      .select("code")
      .order("code", { ascending: false })
      .limit(1) as unknown as Promise<{ data: { code: string }[] | null; error: Error | null }>);
    
    if (data && data.length > 0) {
      const lastCode = data[0].code;
      const num = parseInt(lastCode.replace("LIB", "")) + 1;
      return `LIB${String(num).padStart(3, "0")}`;
    }
    return "LIB001";
  };

  const handleAddBook = async () => {
    if (!newBook.name || !newBook.author || !newBook.category) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const code = await generateBookCode();
      
      const bookInsert = supabase
        .from("books" as "profiles")
        .insert([{
          code,
          name: newBook.name.trim(),
          author: newBook.author.trim(),
          category: newBook.category,
          available: true,
        }] as never);
      
      const { error } = await (bookInsert as unknown as Promise<{ error: Error | null }>);

      if (error) throw error;

      toast({
        title: "Book Added Successfully",
        description: `"${newBook.name}" has been added with code ${code}`,
      });

      setNewBook({ name: "", author: "", category: "" });
      setIsAddBookOpen(false);
      fetchData();
    } catch {
      toast({
        title: "Error",
        description: "Could not add the book. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBook = async (id: string, name: string) => {
    const { error } = await (supabase
      .from("books" as "profiles")
      .delete()
      .eq("id", id) as unknown as Promise<{ error: Error | null }>);

    if (error) {
      toast({
        title: "Error",
        description: "Could not delete the book. It may have active transactions.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Book Deleted",
        description: `"${name}" has been removed from the catalog`,
      });
      fetchData();
    }
  };

  const filteredBooks = books.filter(
    (book) =>
      book.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    { label: "Total Books", value: books.length, icon: Book, color: "text-primary" },
    { label: "Available", value: books.filter((b) => b.available).length, icon: BookCheck, color: "text-success" },
    { label: "Issued", value: books.filter((b) => !b.available).length, icon: BookOpen, color: "text-warning" },
    { label: "Users", value: users.length, icon: Users, color: "text-accent" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Header */}
      <section className="gradient-hero text-primary-foreground py-8">
        <div className="container">
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">
            Admin Dashboard
          </h1>
          <p className="text-primary-foreground/80">
            Manage books, users, and library operations
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-6 border-b border-border">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="flex items-center gap-4 p-4 bg-card rounded-lg shadow-card"
                >
                  <div className={cn("p-3 rounded-lg bg-muted", stat.color)}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="flex-1 py-8">
        <div className="container">
          <Tabs defaultValue="books" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="books" className="gap-2">
                <Book className="h-4 w-4" />
                Manage Books
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>

            {/* Books Management */}
            <TabsContent value="books">
              <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
                <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search books..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Dialog open={isAddBookOpen} onOpenChange={setIsAddBookOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Book
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Book</DialogTitle>
                        <DialogDescription>
                          Add a new book to the library catalog. A unique code
                          will be auto-generated.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Book Name</Label>
                          <Input
                            placeholder="Enter book title"
                            value={newBook.name}
                            onChange={(e) =>
                              setNewBook({ ...newBook, name: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Author</Label>
                          <Input
                            placeholder="Enter author name"
                            value={newBook.author}
                            onChange={(e) =>
                              setNewBook({ ...newBook, author: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select
                            value={newBook.category}
                            onValueChange={(value) =>
                              setNewBook({ ...newBook, category: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsAddBookOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleAddBook} disabled={isSaving}>
                          {isSaving ? "Adding..." : "Add Book"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBooks.map((book) => (
                        <TableRow key={book.id}>
                          <TableCell className="font-mono">{book.code}</TableCell>
                          <TableCell className="font-medium">
                            {book.name}
                          </TableCell>
                          <TableCell>{book.author}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{book.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                book.available
                                  ? "status-available"
                                  : "status-issued"
                              )}
                            >
                              {book.available ? "Available" : "Issued"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDeleteBook(book.id, book.name)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>USN</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>ID Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-mono">{user.usn}</TableCell>
                          <TableCell className="font-medium">
                            {user.full_name}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.phone || "-"}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={user.photo_id_status === "verified" ? "default" : "secondary"}
                            >
                              {user.photo_id_status || "pending"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {users.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No users registered yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Book Code</TableHead>
                        <TableHead>Book Name</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Issue Date</TableHead>
                        <TableHead>Due/Return Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="font-mono">
                            {tx.book_code || "-"}
                          </TableCell>
                          <TableCell className="font-medium">
                            {tx.book_name || "-"}
                          </TableCell>
                          <TableCell>
                            {tx.user_name || "-"}
                            <span className="text-xs text-muted-foreground block">
                              {tx.user_usn}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                tx.type === "issue" ? "default" : "secondary"
                              }
                            >
                              {tx.type === "issue" ? "Issued" : "Returned"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(tx.issue_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {tx.type === "issue" 
                              ? tx.due_date ? new Date(tx.due_date).toLocaleDateString() : "-"
                              : tx.return_date ? new Date(tx.return_date).toLocaleDateString() : "-"
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                      {transactions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No transactions yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Admin;
