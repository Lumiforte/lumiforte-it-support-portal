import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, AlertCircle, Phone } from "lucide-react";
import { TICKET_CATEGORIES } from "@/lib/ticketCategories";

const CreateTicket = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("");
  const [mainCategory, setMainCategory] = useState<string>("");
  const [subCategory, setSubCategory] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [profilePhone, setProfilePhone] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isPhoneCorrect, setIsPhoneCorrect] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchUserProfile();
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("phone_number")
        .eq("id", user.id)
        .single();
      
      if (error) throw error;
      
      if (data?.phone_number) {
        setProfilePhone(data.phone_number);
        setPhoneNumber(data.phone_number);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Format: +country code + area code + subscriber number
    // Example: +31612345678 or +31 6 12345678 or +31-6-12345678
    const phoneRegex = /^\+\d{1,3}[\s-]?\d{1,4}[\s-]?\d{4,}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number
    if (!phoneNumber || (!isPhoneCorrect && !validatePhoneNumber(phoneNumber))) {
      setPhoneError("Please enter a valid phone number in the format: +country area subscriber (e.g., +31 6 12345678)");
      return;
    }
    
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("tickets")
        .insert([{
          created_by: user?.id,
          title,
          description,
          priority: priority as "low" | "medium" | "high" | "urgent",
          category: subCategory, // Keep for backwards compatibility
          main_category: mainCategory,
          sub_category: subCategory,
          phone_number: phoneNumber,
        }])
        .select()
        .single();

      if (error) throw error;

      // Send notification email
      try {
        await supabase.functions.invoke('notify-new-ticket', {
          body: {
            ticketId: data.id,
            title: data.title,
            description: data.description,
            priority: data.priority,
            category: `${mainCategory} - ${subCategory}`,
            userName: user?.user_metadata?.full_name || user?.email || 'Unknown',
            userEmail: user?.email || 'Unknown',
            phoneNumber: phoneNumber
          }
        });
      } catch (emailError) {
        console.error("Error sending notification email:", emailError);
        // Don't fail the ticket creation if email fails
      }

      toast({
        title: "Ticket created!",
        description: "Your support ticket has been submitted successfully.",
      });

      navigate(`/tickets/${data.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/tickets")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">Create Support Ticket</h1>
            <p className="text-muted-foreground">Describe your IT issue and we'll help you</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ticket Details</CardTitle>
            <CardDescription>
              Please provide as much detail as possible to help us resolve your issue quickly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Brief description of the issue"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mainCategory">Main Category *</Label>
                <Select value={mainCategory} onValueChange={(value) => {
                  setMainCategory(value);
                  setSubCategory(""); // Reset subcategory when main changes
                }} required>
                  <SelectTrigger id="mainCategory">
                    <SelectValue placeholder="Select a main category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(TICKET_CATEGORIES).map((key) => (
                      <SelectItem key={key} value={key}>
                        {TICKET_CATEGORIES[key as keyof typeof TICKET_CATEGORIES].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {mainCategory && (
                <div className="space-y-2">
                  <Label htmlFor="subCategory">Sub Category *</Label>
                  <Select value={subCategory} onValueChange={setSubCategory} required>
                    <SelectTrigger id="subCategory">
                      <SelectValue placeholder="Select a sub category" />
                    </SelectTrigger>
                    <SelectContent>
                      {TICKET_CATEGORIES[mainCategory as keyof typeof TICKET_CATEGORIES].subcategories.map((sub) => (
                        <SelectItem key={sub.value} value={sub.value}>
                          {sub.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select value={priority} onValueChange={setPriority} required>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Can wait</SelectItem>
                    <SelectItem value="medium">Medium - Normal priority</SelectItem>
                    <SelectItem value="high">High - Affects work</SelectItem>
                    <SelectItem value="urgent">Urgent - Work stopped</SelectItem>
                  </SelectContent>
                </Select>
                
                {priority === "urgent" && (
                  <Alert className="mt-4 border-orange-500 bg-orange-50 dark:bg-orange-950/20">
                    <Phone className="h-4 w-4 text-orange-600" />
                    <AlertTitle className="text-orange-800 dark:text-orange-400">A phone call is faster!</AlertTitle>
                    <AlertDescription className="text-orange-700 dark:text-orange-300">
                      For urgent issues, it is best to call one of our IT staff directly:
                      <div className="mt-2 space-y-1 font-medium">
                        <div>• Jeroen Vrieselaar: <a href="tel:+31655387622" className="underline hover:text-orange-900">+31 6 5538 7622</a></div>
                        <div>• Jort Gerritsen: <a href="tel:+31646372789" className="underline hover:text-orange-900">+31 6 4637 2789</a></div>
                        <div>• TCC smart IT solutions: <a href="tel:+31433630362" className="underline hover:text-orange-900">+31 43 363 0362</a></div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-3">
                <Label>Contact Phone Number *</Label>
                {profilePhone && (
                  <div className="flex items-start space-x-2 p-3 border rounded-md bg-muted/50">
                    <Checkbox
                      id="phoneCorrect"
                      checked={isPhoneCorrect}
                      onCheckedChange={(checked) => {
                        setIsPhoneCorrect(checked as boolean);
                        setPhoneError("");
                        if (checked) {
                          setPhoneNumber(profilePhone);
                        }
                      }}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="phoneCorrect"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        My phone number is: {profilePhone}
                      </label>
                      <p className="text-sm text-muted-foreground">
                        Check this if the number above is correct
                      </p>
                    </div>
                  </div>
                )}
                
                {(!profilePhone || !isPhoneCorrect) && (
                  <div className="space-y-2">
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="+31 6 12345678"
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value);
                        setPhoneError("");
                      }}
                      className={phoneError ? "border-destructive" : ""}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Format: +landcode netnummer abonneenummer (bijv. +31 6 12345678)
                    </p>
                    {phoneError && (
                      <p className="text-xs text-destructive">{phoneError}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed description of the issue, including what you've already tried..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={8}
                  required
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Ticket
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/tickets")}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
  );
};

export default CreateTicket;
