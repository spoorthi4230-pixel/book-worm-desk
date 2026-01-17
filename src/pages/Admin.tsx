import { useState } from "react";
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
import { mockBooks, categories } from "@/data/mockBooks";
import { cn } from "@/lib/utils";

const mockUsers = [
  { id: "USR1001", name: "John Doe", email: "john@university.edu", department: "Computer Science", booksIssued: 2 },
  { id: "USR1002", name: "Jane Smith", email: "jane@university.edu", department: "Mathematics", booksIssued: 1 },
  { id: "USR1003", name: "Mike Johnson", email: "mike@university.edu", department: "Physics", booksIssued: 0 },
];

const mockTransactions = [
  { id: 1, bookCode: "LIB003", userId: "USR1001", type: "issue", date: "2024-01-15", dueDate: "2024-01-29" },
  { id: 2, bookCode: "LIB006", userId: "USR1002", type: "issue", date: "2024-01-14", dueDate: "2024-01-28" },
  { id: 3, bookCode: "LIB010", userId: "USR1001", type: "issue", date: "2024-01-10", dueDate: "2024-01-24" },
  { id: 4, bookCode: "LIB002", userId: "USR1003", type: "return", date: "2024-01-12", returnedDate: "2024-01-12" },
];

const Admin = () => {
  const { toast } = useToast();
  const [books, setBooks] = useState(mockBooks);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [newBook, setNewBook] = useState({
    name: "",
    author: "",
    category: "",
  });

  const generateBookCode = () => {
    const maxCode = Math.max(
      ...books.map((b) => parseInt(b.code.replace("LIB", "")))
    );
    return `LIB${String(maxCode + 1).padStart(3, "0")}`;
  };

  const handleAddBook = () => {
    if (!newBook.name || !newBook.author || !newBook.category) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const code = generateBookCode();
    const book = {
      id: String(books.length + 1),
      code,
      name: newBook.name,
      author: newBook.author,
      category: newBook.category,
      available: true,
    };

    setBooks([...books, book]);
    setNewBook({ name: "", author: "", category: "" });
    setIsAddBookOpen(false);
    toast({
      title: "Book Added Successfully",
      description: `"${book.name}" has been added with code ${code}`,
    });
  };

  const handleDeleteBook = (id: string) => {
    setBooks(books.filter((b) => b.id !== id));
    toast({
      title: "Book Deleted",
      description: "The book has been removed from the catalog",
    });
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
    { label: "Users", value: mockUsers.length, icon: Users, color: "text-accent" },
  ];

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
                              {categories
                                .filter((c) => c !== "All")
                                .map((category) => (
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
                        <Button onClick={handleAddBook}>Add Book</Button>
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
                                onClick={() => handleDeleteBook(book.id)}
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
                        <TableHead>User ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Books Issued</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-mono">{user.id}</TableCell>
                          <TableCell className="font-medium">
                            {user.name}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.department}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{user.booksIssued}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
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
                        <TableHead>User ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Due/Returned</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockTransactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="font-mono">
                            {tx.bookCode}
                          </TableCell>
                          <TableCell className="font-mono">{tx.userId}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                tx.type === "issue" ? "default" : "secondary"
                              }
                            >
                              {tx.type === "issue" ? "Issued" : "Returned"}
                            </Badge>
                          </TableCell>
                          <TableCell>{tx.date}</TableCell>
                          <TableCell>
                            {tx.type === "issue" ? tx.dueDate : tx.returnedDate}
                          </TableCell>
                        </TableRow>
                      ))}
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
