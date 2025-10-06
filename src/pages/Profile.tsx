import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Languages, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { COMPANIES } from "@/lib/companies";

const Profile = () => {
  const { profile, user } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [company, setCompany] = useState("");
  const [companyOpen, setCompanyOpen] = useState(false);
  
  const PROTECTED_ADMINS = ['jeroen.vrieselaar@lumiforte.com', 'jort.gerritsen@lumiforte.com'];
  const isProtectedAdmin = profile?.email && PROTECTED_ADMINS.includes(profile.email);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhoneNumber("");
      setCompany("");
      
      // Fetch phone number and company from profile
      const fetchProfileDetails = async () => {
        const { data } = await supabase
          .from("profiles")
          .select("phone_number, company")
          .eq("id", profile.id)
          .single();
        
        if (data) {
          if (data.phone_number) {
            setPhoneNumber(data.phone_number);
          }
          if (data.company) {
            setCompany(data.company);
          }
        }
      };
      
      fetchProfileDetails();
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) return;
    
    // Prevent protected admins from updating their profile
    if (isProtectedAdmin) {
      toast({
        title: "Protected Account",
        description: "This admin account cannot be modified.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone_number: phoneNumber.trim() || null,
          company: company || null,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: t("profile.successMessage"),
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: t("profile.errorMessage"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t("profile.title")}</CardTitle>
          <CardDescription>{t("profile.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">{t("profile.email")}</Label>
              <Input
                id="email"
                type="email"
                value={profile?.email || ""}
                disabled
                className="bg-muted"
              />
              {isProtectedAdmin && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  🛡️ Protected admin account - email cannot be changed
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">{t("profile.fullName")}</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={isProtectedAdmin}
                className={isProtectedAdmin ? "bg-muted" : ""}
              />
              {isProtectedAdmin && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  🛡️ Protected admin account - name cannot be changed
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">{t("profile.phoneNumber")}</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder={t("profile.phoneNumberPlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Popover open={companyOpen} onOpenChange={setCompanyOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="company"
                    variant="outline"
                    role="combobox"
                    aria-expanded={companyOpen}
                    className="w-full justify-between"
                  >
                    {company || "Select company..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search company..." />
                    <CommandList>
                      <CommandEmpty>No company found.</CommandEmpty>
                      <CommandGroup>
                        {COMPANIES.map((companyOption) => (
                          <CommandItem
                            key={companyOption.value}
                            value={companyOption.value}
                            onSelect={(currentValue) => {
                              setCompany(currentValue === company ? "" : currentValue);
                              setCompanyOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                company === companyOption.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {companyOption.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">
                <Languages className="inline h-4 w-4 mr-2" />
                {t("profile.language")}
              </Label>
              <Select value={language} onValueChange={(value) => setLanguage(value as any)}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">
                    <span className="flex items-center justify-between w-full">
                      English
                      {language === "en" && <Check className="h-4 w-4 ml-2" />}
                    </span>
                  </SelectItem>
                  <SelectItem value="nl">
                    <span className="flex items-center justify-between w-full">
                      Nederlands
                      {language === "nl" && <Check className="h-4 w-4 ml-2" />}
                    </span>
                  </SelectItem>
                  <SelectItem value="fr">
                    <span className="flex items-center justify-between w-full">
                      Français
                      {language === "fr" && <Check className="h-4 w-4 ml-2" />}
                    </span>
                  </SelectItem>
                  <SelectItem value="de">
                    <span className="flex items-center justify-between w-full">
                      Deutsch
                      {language === "de" && <Check className="h-4 w-4 ml-2" />}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t("profile.languageDescription")}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Your Roles</Label>
              <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-md">
                {profile?.roles && profile.roles.length > 0 ? (
                  profile.roles.map((role) => (
                    <Badge key={role} variant="secondary" className="capitalize">
                      {role}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No roles assigned</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Contact an administrator to modify your roles
              </p>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("profile.saving")}
                </>
              ) : (
                t("profile.save")
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
