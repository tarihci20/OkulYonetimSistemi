import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Kullanıcı verilerini getir
  const {
    data: user,
    error,
    isLoading,
    refetch: refetchUser
  } = useQuery<SelectUser | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/user", {
          credentials: "include" // Çerezleri dahil etmek için önemli
        });
        
        if (response.status === 401) {
          return null;
        }
        
        if (!response.ok) {
          throw new Error(`API hatası: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error("Kullanıcı bilgileri alınırken hata:", error);
        return null;
      }
    },
    retry: false,
    staleTime: 60000 // 1 dakika
  });

  // Giriş (login) fonksiyonu
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(credentials),
        credentials: "include" // Çerezleri dahil et
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Giriş başarısız");
      }
      
      return await res.json();
    },
    onSuccess: (userData: SelectUser) => {
      // Başarılı giriş
      queryClient.setQueryData(["/api/user"], userData);
      refetchUser(); // Kullanıcı verilerini yenile
      
      toast({
        title: "Başarılı Giriş",
        description: "Hoş geldiniz, yönlendiriliyorsunuz...",
      });
    },
    onError: (error: Error) => {
      // Hata durumu
      toast({
        title: "Giriş başarısız",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Kayıt (register) fonksiyonu
  const registerMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(userData),
        credentials: "include" // Çerezleri dahil et
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Kayıt başarısız");
      }
      
      return await res.json();
    },
    onSuccess: (userData: SelectUser) => {
      // Başarılı kayıt
      queryClient.setQueryData(["/api/user"], userData);
      refetchUser(); // Kullanıcı verilerini yenile
      
      toast({
        title: "Kayıt Başarılı",
        description: "Hesabınız oluşturuldu ve giriş yapıldı.",
      });
    },
    onError: (error: Error) => {
      // Hata durumu
      toast({
        title: "Kayıt başarısız",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Çıkış (logout) fonksiyonu
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/logout", {
        method: "POST",
        credentials: "include" // Çerezleri dahil et
      });
      
      if (!res.ok) {
        throw new Error("Çıkış yapılırken hata oluştu");
      }
    },
    onSuccess: () => {
      // Başarılı çıkış
      queryClient.setQueryData(["/api/user"], null);
      queryClient.invalidateQueries(); // Tüm sorguları geçersiz kıl
      
      toast({
        title: "Çıkış Yapıldı",
        description: "Güvenli bir şekilde çıkış yaptınız.",
      });
    },
    onError: (error: Error) => {
      // Hata durumu
      toast({
        title: "Çıkış başarısız",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}