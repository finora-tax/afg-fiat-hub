import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreVertical, UserCheck, UserX, Shield, Eye } from "lucide-react";
import { toast } from "sonner";

const mockUsers = [
  {
    id: "1",
    name: "احمد محمدی",
    email: "ahmad@example.com",
    phone: "+93 700 123 456",
    status: "active",
    kycStatus: "verified",
    balance: "125,000 AFN",
    joinDate: "1402/09/15",
  },
  {
    id: "2",
    name: "فاطمه رحیمی",
    email: "fatima@example.com",
    phone: "+93 700 234 567",
    status: "active",
    kycStatus: "pending",
    balance: "45,000 AFN",
    joinDate: "1402/10/02",
  },
  {
    id: "3",
    name: "محمد کریمی",
    email: "mohammad@example.com",
    phone: "+93 700 345 678",
    status: "suspended",
    kycStatus: "rejected",
    balance: "0 AFN",
    joinDate: "1402/08/20",
  },
  {
    id: "4",
    name: "زهرا احمدی",
    email: "zahra@example.com",
    phone: "+93 700 456 789",
    status: "active",
    kycStatus: "verified",
    balance: "320,000 AFN",
    joinDate: "1402/07/10",
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge className="bg-primary/20 text-primary border-primary/30">فعال</Badge>;
    case "suspended":
      return <Badge className="bg-destructive/20 text-destructive border-destructive/30">معلق</Badge>;
    default:
      return <Badge variant="secondary">نامشخص</Badge>;
  }
};

const getKycBadge = (status: string) => {
  switch (status) {
    case "verified":
      return <Badge className="bg-primary/20 text-primary border-primary/30">تأیید شده</Badge>;
    case "pending":
      return <Badge className="bg-accent/20 text-accent border-accent/30">در انتظار</Badge>;
    case "rejected":
      return <Badge className="bg-destructive/20 text-destructive border-destructive/30">رد شده</Badge>;
    default:
      return <Badge variant="secondary">نامشخص</Badge>;
  }
};

export const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [users] = useState(mockUsers);

  const filteredUsers = users.filter(
    (user) =>
      user.name.includes(searchQuery) ||
      user.email.includes(searchQuery) ||
      user.phone.includes(searchQuery)
  );

  const handleSuspendUser = (userId: string) => {
    toast.success("کاربر با موفقیت معلق شد");
  };

  const handleActivateUser = (userId: string) => {
    toast.success("کاربر با موفقیت فعال شد");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">مدیریت کاربران</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="جستجوی کاربر..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 w-64"
            />
          </div>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">لیست کاربران ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-right">نام</TableHead>
                <TableHead className="text-right">ایمیل</TableHead>
                <TableHead className="text-right">تلفن</TableHead>
                <TableHead className="text-right">وضعیت</TableHead>
                <TableHead className="text-right">KYC</TableHead>
                <TableHead className="text-right">موجودی</TableHead>
                <TableHead className="text-right">تاریخ عضویت</TableHead>
                <TableHead className="text-right">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-border">
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground" dir="ltr">{user.email}</TableCell>
                  <TableCell className="text-muted-foreground" dir="ltr">{user.phone}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>{getKycBadge(user.kycStatus)}</TableCell>
                  <TableCell className="font-mono text-accent">{user.balance}</TableCell>
                  <TableCell className="text-muted-foreground">{user.joinDate}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 ml-2" />
                          مشاهده جزئیات
                        </DropdownMenuItem>
                        {user.status === "active" ? (
                          <DropdownMenuItem onClick={() => handleSuspendUser(user.id)} className="text-destructive">
                            <UserX className="h-4 w-4 ml-2" />
                            تعلیق کاربر
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleActivateUser(user.id)} className="text-primary">
                            <UserCheck className="h-4 w-4 ml-2" />
                            فعال‌سازی
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <Shield className="h-4 w-4 ml-2" />
                          تغییر نقش
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
