-- Create books table for library catalog
CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  author TEXT NOT NULL,
  category TEXT NOT NULL,
  available BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on books
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view books
CREATE POLICY "Anyone can view books"
ON public.books FOR SELECT
TO authenticated
USING (true);

-- Only admins can insert books
CREATE POLICY "Admins can insert books"
ON public.books FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update books
CREATE POLICY "Admins can update books"
ON public.books FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete books
CREATE POLICY "Admins can delete books"
ON public.books FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create book_transactions table for issue/return history
CREATE TABLE public.book_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('issue', 'return')) NOT NULL,
  issue_date TIMESTAMPTZ NOT NULL,
  due_date TIMESTAMPTZ,
  return_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on book_transactions
ALTER TABLE public.book_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users view own transactions"
ON public.book_transactions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can view all transactions
CREATE POLICY "Admins view all transactions"
ON public.book_transactions FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can create transactions
CREATE POLICY "Admins create transactions"
ON public.book_transactions FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update transactions (for corrections)
CREATE POLICY "Admins update transactions"
ON public.book_transactions FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at on books
CREATE TRIGGER update_books_updated_at
BEFORE UPDATE ON public.books
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create index for faster lookups
CREATE INDEX idx_books_code ON public.books(code);
CREATE INDEX idx_books_category ON public.books(category);
CREATE INDEX idx_book_transactions_user_id ON public.book_transactions(user_id);
CREATE INDEX idx_book_transactions_book_id ON public.book_transactions(book_id);

-- Seed initial book data from mock data
INSERT INTO public.books (code, name, author, category, available) VALUES
  ('LIB001', 'Introduction to Algorithms', 'Thomas H. Cormen', 'Technology', true),
  ('LIB002', 'The Great Gatsby', 'F. Scott Fitzgerald', 'Fiction', true),
  ('LIB003', 'A Brief History of Time', 'Stephen Hawking', 'Science', false),
  ('LIB004', 'The Art of War', 'Sun Tzu', 'Philosophy', true),
  ('LIB005', 'Clean Code', 'Robert C. Martin', 'Technology', true),
  ('LIB006', 'Sapiens: A Brief History of Humankind', 'Yuval Noah Harari', 'History', false),
  ('LIB007', 'To Kill a Mockingbird', 'Harper Lee', 'Fiction', true),
  ('LIB008', 'Calculus: Early Transcendentals', 'James Stewart', 'Mathematics', true),
  ('LIB009', 'The Origin of Species', 'Charles Darwin', 'Science', true),
  ('LIB010', 'The Story of Art', 'E.H. Gombrich', 'Arts', false),
  ('LIB011', '1984', 'George Orwell', 'Fiction', true),
  ('LIB012', 'Meditations', 'Marcus Aurelius', 'Philosophy', true);