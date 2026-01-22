import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Phone, Building, Lock, ArrowRight, IdCard, Upload, X, FileCheck } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const departments = [
  "Computer Science",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Business Administration",
  "Arts & Humanities",
  "Natural Sciences",
  "Mathematics",
  "Other",
];

// Validation schema
const registrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  usn: z.string().regex(/^[0-9]{1}[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{3}$/i, "Invalid USN format (e.g., 1XX21CS001)"),
  email: z.string().email("Please enter a valid email address").max(255, "Email is too long"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(20, "Phone number is too long"),
  department: z.string().min(1, "Please select a department"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    usn: "",
    email: "",
    phone: "",
    department: "",
    password: "",
    confirmPassword: "",
  });
  const [photoIdFile, setPhotoIdFile] = useState<File | null>(null);
  const [photoIdPreview, setPhotoIdPreview] = useState<string | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkAuth();
  }, [navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a JPG, PNG, or PDF file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      setPhotoIdFile(file);

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPhotoIdPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPhotoIdPreview(null);
      }
    }
  };

  const removePhotoId = () => {
    setPhotoIdFile(null);
    setPhotoIdPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    const validation = registrationSchema.safeParse(formData);
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    // Check if photo ID is uploaded
    if (!photoIdFile) {
      toast({
        title: "Photo ID Required",
        description: "Please upload a valid photo ID for verification",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create auth user
      const redirectUrl = `${window.location.origin}/login`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (authError) {
        let errorMessage = "Registration failed. Please try again.";
        if (authError.message.includes("already registered")) {
          errorMessage = "This email is already registered. Please try logging in.";
        } else if (authError.message.includes("valid email")) {
          errorMessage = "Please enter a valid email address.";
        }
        
        toast({
          title: "Registration Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      if (!authData.user) {
        toast({
          title: "Registration Failed",
          description: "Could not create user account. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const userId = authData.user.id;

      // 2. Upload photo ID to storage
      const fileExt = photoIdFile.name.split('.').pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('photo-ids')
        .upload(filePath, photoIdFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        // Continue even if upload fails - profile can still be created
        // Log generic message to avoid exposing internal details
        if (import.meta.env.DEV) {
          console.error('Photo upload failed');
        }
      }

      // 3. Create profile in database
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          full_name: formData.name.trim(),
          usn: formData.usn.toUpperCase(),
          email: formData.email.toLowerCase().trim(),
          phone: formData.phone.trim(),
          photo_id_path: uploadError ? null : filePath,
          photo_id_status: 'pending',
        });

      if (profileError) {
        let errorMessage = "Could not create profile. Please contact support.";
        if (profileError.message.includes("usn_format") || profileError.message.includes("usn")) {
          errorMessage = "Invalid USN format. Please use format like 1XX21CS001.";
        } else if (profileError.message.includes("unique") || profileError.message.includes("duplicate")) {
          errorMessage = "This USN is already registered. Please check your USN.";
        }
        
        toast({
          title: "Profile Creation Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      // 4. Create user_roles entry (default role is 'user')
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'user',
        });

      if (roleError) {
        // Non-critical error - user can still use the system
        // Only log in development mode without exposing internal details
        if (import.meta.env.DEV) {
          console.error('Role assignment failed');
        }
      }

      toast({
        title: "Registration Successful!",
        description: "Your account has been created. Your photo ID is pending verification.",
      });
      
      navigate("/login");
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <section className="flex-1 py-12 lg:py-16">
        <div className="container max-w-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-serif font-bold text-foreground">
              Create Your Account
            </h1>
            <p className="text-muted-foreground mt-2">
              Register to start borrowing books from our library
            </p>
          </div>

          <div className="bg-card rounded-xl shadow-lg p-6 lg:p-8 border border-border">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* USN */}
              <div className="space-y-2">
                <Label htmlFor="usn">University Serial Number (USN)</Label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="usn"
                    type="text"
                    placeholder="1XX21CS001"
                    value={formData.usn}
                    onChange={(e) =>
                      setFormData({ ...formData, usn: e.target.value.toUpperCase() })
                    }
                    className="pl-10 uppercase"
                    required
                    maxLength={10}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter your unique university serial number (e.g., 1XX21CS001)
                </p>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@university.edu"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="department">Department / Class</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) =>
                    setFormData({ ...formData, department: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Select your department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Photo ID Upload */}
              <div className="space-y-2">
                <Label htmlFor="photoId">Photo ID for Verification</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 transition-colors hover:border-primary/50">
                  {!photoIdFile ? (
                    <div 
                      className="flex flex-col items-center justify-center cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium text-foreground">
                        Click to upload your Photo ID
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        College ID, Aadhar Card, or any valid Government ID
                      </p>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG or PDF (Max 5MB)
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      {photoIdPreview ? (
                        <img 
                          src={photoIdPreview} 
                          alt="ID Preview" 
                          className="w-16 h-16 object-cover rounded-lg border border-border"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                          <FileCheck className="h-6 w-6 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {photoIdFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(photoIdFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={removePhotoId}
                        className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    id="photoId"
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Your ID will be verified by the library admin before account activation
                </p>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  "Creating Account..."
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto text-primary"
                  onClick={() => navigate("/login")}
                >
                  Sign in here
                </Button>
              </p>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Register;
