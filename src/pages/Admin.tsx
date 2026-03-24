import { useState } from "react";
import { Navigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { RateManagement } from "@/components/admin/RateManagement";
import { UserManagement } from "@/components/admin/UserManagement";
import { KYCManagement } from "@/components/admin/KYCManagement";
import { FinancialReports } from "@/components/admin/FinancialReports";
import { AuditLogViewer } from "@/components/admin/AuditLogViewer";
import { FeeManagement } from "@/components/admin/FeeManagement";
import { WalletManagement } from "@/components/admin/WalletManagement";
import { TransferManagement } from "@/components/admin/TransferManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Users, Shield, BarChart3, Settings, ClipboardList, DollarSign, Wallet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("rates");
  const { user, isAdmin, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">پنل مدیریت</h1>
          </div>
          <p className="text-muted-foreground">مدیریت نرخ‌ها، کاربران، KYC، گزارش‌ها و لاگ فعالیت‌ها</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-4xl grid-cols-7 mb-8">
            <TabsTrigger value="rates" className="flex items-center gap-2"><TrendingUp className="h-4 w-4" />نرخ ارز</TabsTrigger>
            <TabsTrigger value="fees" className="flex items-center gap-2"><DollarSign className="h-4 w-4" />کارمزد</TabsTrigger>
            <TabsTrigger value="wallets" className="flex items-center gap-2"><Wallet className="h-4 w-4" />کیف پول</TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2"><Users className="h-4 w-4" />کاربران</TabsTrigger>
            <TabsTrigger value="kyc" className="flex items-center gap-2"><Shield className="h-4 w-4" />KYC</TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2"><BarChart3 className="h-4 w-4" />گزارش‌ها</TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2"><ClipboardList className="h-4 w-4" />لاگ‌ها</TabsTrigger>
          </TabsList>

          <TabsContent value="rates"><RateManagement /></TabsContent>
          <TabsContent value="fees"><FeeManagement /></TabsContent>
          <TabsContent value="wallets"><WalletManagement /></TabsContent>
          <TabsContent value="users"><UserManagement /></TabsContent>
          <TabsContent value="kyc"><KYCManagement /></TabsContent>
          <TabsContent value="reports"><FinancialReports /></TabsContent>
          <TabsContent value="audit"><AuditLogViewer /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
