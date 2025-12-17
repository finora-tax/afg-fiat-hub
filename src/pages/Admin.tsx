import { useState } from "react";
import Header from "@/components/layout/Header";
import { RateManagement } from "@/components/admin/RateManagement";
import { UserManagement } from "@/components/admin/UserManagement";
import { KYCManagement } from "@/components/admin/KYCManagement";
import { FinancialReports } from "@/components/admin/FinancialReports";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  Users, 
  Shield, 
  BarChart3,
  Settings
} from "lucide-react";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("rates");

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">پنل مدیریت</h1>
          </div>
          <p className="text-muted-foreground">مدیریت نرخ‌ها، کاربران، KYC و گزارش‌های مالی</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4 mb-8">
            <TabsTrigger value="rates" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              نرخ ارز
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              کاربران
            </TabsTrigger>
            <TabsTrigger value="kyc" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              KYC
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              گزارش‌ها
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rates">
            <RateManagement />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="kyc">
            <KYCManagement />
          </TabsContent>

          <TabsContent value="reports">
            <FinancialReports />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
