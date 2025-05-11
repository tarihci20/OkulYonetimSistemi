import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Redirect } from "wouter";
import { School, UserPlus, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";

// Schema for login form
const loginFormSchema = z.object({
  username: z.string().min(1, "Kullanıcı adı gereklidir"),
  password: z.string().min(1, "Şifre gereklidir"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

// Schema for registration form
const registerFormSchema = z.object({
  username: z.string().min(3, "Kullanıcı adı en az 3 karakter olmalıdır"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  fullName: z.string().min(1, "Ad soyad gereklidir"),
  isAdmin: z.boolean().optional(),
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("login");

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      isAdmin: false,
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate({
      username: data.username,
      password: data.password,
    });
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate({
      username: data.username,
      password: data.password,
      fullName: data.fullName,
      isAdmin: data.isAdmin || false,
    });
  };

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col sm:flex-row bg-neutral-50">
      {/* Left side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="login">Giriş Yap</TabsTrigger>
              <TabsTrigger value="register">Kayıt Ol</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Giriş Yap</CardTitle>
                  <CardDescription>
                    Sisteme giriş yapmak için bilgilerinizi giriniz.
                  </CardDescription>
                </CardHeader>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
                    <CardContent className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kullanıcı Adı</FormLabel>
                            <FormControl>
                              <Input placeholder="Kullanıcı adınızı giriniz" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Şifre</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Şifrenizi giriniz" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={loginForm.control}
                        name="rememberMe"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm cursor-pointer">Beni hatırla</FormLabel>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                    <CardFooter>
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                            <span>Giriş yapılıyor...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <LogIn className="h-4 w-4" />
                            <span>Giriş Yap</span>
                          </div>
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Kayıt Ol</CardTitle>
                  <CardDescription>
                    Yeni bir hesap oluşturmak için bilgilerinizi giriniz.
                  </CardDescription>
                </CardHeader>
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
                    <CardContent className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ad Soyad</FormLabel>
                            <FormControl>
                              <Input placeholder="Ad ve soyadınızı giriniz" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kullanıcı Adı</FormLabel>
                            <FormControl>
                              <Input placeholder="Kullanıcı adınızı giriniz" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Şifre</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Şifrenizi giriniz" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="isAdmin"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm cursor-pointer">Yönetici yetkisi</FormLabel>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                    <CardFooter>
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                            <span>Kayıt yapılıyor...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <UserPlus className="h-4 w-4" />
                            <span>Kayıt Ol</span>
                          </div>
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {activeTab === "login" ? (
              <p>
                Hesabınız yok mu?{" "}
                <Button 
                  variant="link" 
                  className="p-0 h-auto" 
                  onClick={() => setActiveTab("register")}
                >
                  Kayıt ol
                </Button>
              </p>
            ) : (
              <p>
                Zaten bir hesabınız var mı?{" "}
                <Button 
                  variant="link" 
                  className="p-0 h-auto" 
                  onClick={() => setActiveTab("login")}
                >
                  Giriş yap
                </Button>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right side - Hero section */}
      <div className="flex-1 bg-primary p-8 text-white flex flex-col justify-center hidden md:flex">
        <div className="max-w-md mx-auto">
          <div className="flex items-center mb-6">
            <School className="h-12 w-12 mr-3" />
            <h1 className="text-3xl font-bold">Vildan İdare Kolaylık Sayfası</h1>
          </div>
          <p className="text-xl mb-6">
            Okul İdare Yönetim Sistemi
          </p>
          <ul className="space-y-3 mb-8">
            <li className="flex items-start">
              <div className="rounded-full bg-white bg-opacity-20 p-1 mr-3 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Ders programı yönetimi</span>
            </li>
            <li className="flex items-start">
              <div className="rounded-full bg-white bg-opacity-20 p-1 mr-3 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Nöbet yönetimi ve takibi</span>
            </li>
            <li className="flex items-start">
              <div className="rounded-full bg-white bg-opacity-20 p-1 mr-3 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Yoklama ve yerine görevlendirme sistemi</span>
            </li>
            <li className="flex items-start">
              <div className="rounded-full bg-white bg-opacity-20 p-1 mr-3 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Otomatik ek ders hesaplaması</span>
            </li>
          </ul>
          <p className="text-sm opacity-80">
            Okul yönetiminizi kolaylaştıracak çözümler için hemen giriş yapın.
          </p>
        </div>
      </div>
    </div>
  );
}
