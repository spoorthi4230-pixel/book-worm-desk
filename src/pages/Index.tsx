import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Users, ArrowRight, Clock, BookCheck, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BookCard } from "@/components/BookCard";
import { SearchBar } from "@/components/SearchBar";
import { mockBooks } from "@/data/mockBooks";

const stats = [
  { label: "Total Books", value: "10,000+", icon: BookOpen },
  { label: "Registered Users", value: "2,500+", icon: Users },
  { label: "Books Issued", value: "15,000+", icon: BookCheck },
  { label: "Years of Service", value: "25+", icon: Clock },
];

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const featuredBooks = mockBooks.slice(0, 4);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/books?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate("/books");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative gradient-hero text-primary-foreground py-20 lg:py-28 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-tight animate-fade-up">
              Your Gateway to
              <span className="block text-accent">Knowledge & Learning</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: "0.1s" }}>
              Discover thousands of books across all categories. Search, borrow, and expand your horizons with our comprehensive library management system.
            </p>

            <div className="pt-4 animate-fade-up" style={{ animationDelay: "0.2s" }}>
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onSearch={handleSearch}
                variant="hero"
              />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4 animate-fade-up" style={{ animationDelay: "0.3s" }}>
              <Link to="/books">
                <Button size="lg" className="gradient-accent text-accent-foreground hover:opacity-90 gap-2">
                  Browse Catalog
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 gap-2">
                  <Users className="h-4 w-4" />
                  Register Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-card border-b border-border">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="text-center p-6 rounded-lg bg-background shadow-card animate-fade-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="font-serif text-2xl font-bold text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Books Section */}
      <section className="py-16 lg:py-20">
        <div className="container">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="text-3xl font-serif font-bold text-foreground">
                Featured Books
              </h2>
              <p className="text-muted-foreground mt-2">
                Explore our most popular titles this month
              </p>
            </div>
            <Link to="/books">
              <Button variant="outline" className="gap-2">
                View All Books
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredBooks.map((book, index) => (
              <div
                key={book.id}
                className="animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <BookCard book={book} onClick={() => navigate("/books")} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-20 bg-secondary">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
              Ready to Start Your Reading Journey?
            </h2>
            <p className="text-muted-foreground text-lg">
              Register today and get instant access to our entire collection. 
              Borrow books, track your reading history, and discover new favorites.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link to="/register">
                <Button size="lg" className="gap-2">
                  Create Account
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="gap-2">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
