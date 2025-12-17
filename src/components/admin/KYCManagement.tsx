import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  User, 
  Phone, 
  Mail,
  MapPin,
  Calendar,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const mockKycRequests = [
  {
    id: "1",
    userId: "u1",
    name: "فاطمه رحیمی",
    email: "fatima@example.com",
    phone: "+93 700 234 567",
    address: "کابل، منطقه ۳",
    nationalId: "1234567890",
    birthDate: "1370/05/12",
    submittedAt: "1402/10/05 14:30",
    status: "pending",
    documents: ["تذکره", "سند اقامت"],
  },
  {
    id: "2",
    userId: "u2",
    name: "علی حسینی",
    email: "ali@example.com",
    phone: "+93 700 567 890",
    address: "هرات، شهر نو",
    nationalId: "0987654321",
    birthDate: "1365/08/20",
    submittedAt: "1402/10/04 10:15",
    status: "pending",
    documents: ["تذکره", "پاسپورت"],
  },
  {
    id: "3",
    userId: "u3",
    name: "مریم احمدی",
    email: "maryam@example.com",
    phone: "+93 700 678 901",
    address: "مزار شریف",
    nationalId: "1122334455",
    birthDate: "1375/02/08",
    submittedAt: "1402/10/03 16:45",
    status: "pending",
    documents: ["تذکره"],
  },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case "verified":
      return <CheckCircle className="h-5 w-5 text-primary" />;
    case "rejected":
      return <XCircle className="h-5 w-5 text-destructive" />;
    default:
      return <Clock className="h-5 w-5 text-accent" />;
  }
};

export const KYCManagement = () => {
  const [requests, setRequests] = useState(mockKycRequests);
  const [selectedRequest, setSelectedRequest] = useState<typeof mockKycRequests[0] | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = (id: string) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: "verified" } : r));
    toast.success("درخواست KYC تأیید شد");
  };

  const handleReject = (id: string) => {
    if (!rejectionReason.trim()) {
      toast.error("لطفاً دلیل رد را وارد کنید");
      return;
    }
    setRequests(requests.map(r => r.id === id ? { ...r, status: "rejected" } : r));
    toast.success("درخواست KYC رد شد");
    setRejectionReason("");
  };

  const pendingRequests = requests.filter(r => r.status === "pending");
  const verifiedRequests = requests.filter(r => r.status === "verified");
  const rejectedRequests = requests.filter(r => r.status === "rejected");

  const KycCard = ({ request }: { request: typeof mockKycRequests[0] }) => (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <User className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{request.name}</h3>
              <p className="text-sm text-muted-foreground">{request.submittedAt}</p>
            </div>
          </div>
          {getStatusIcon(request.status)}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground" dir="ltr">{request.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground" dir="ltr">{request.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{request.address}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{request.birthDate}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">مدارک:</span>
          {request.documents.map((doc, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {doc}
            </Badge>
          ))}
        </div>

        {request.status === "pending" && (
          <div className="flex items-center gap-2 pt-4 border-t border-border">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="h-4 w-4 ml-2" />
                  بررسی مدارک
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>بررسی مدارک KYC - {request.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">شماره تذکره</p>
                      <p className="font-mono">{request.nationalId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">تاریخ تولد</p>
                      <p>{request.birthDate}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>دلیل رد (در صورت رد)</Label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="دلیل رد درخواست را وارد کنید..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleApprove(request.id)} className="flex-1 bg-primary hover:bg-primary/90">
                      <CheckCircle className="h-4 w-4 ml-2" />
                      تأیید
                    </Button>
                    <Button onClick={() => handleReject(request.id)} variant="destructive" className="flex-1">
                      <XCircle className="h-4 w-4 ml-2" />
                      رد
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={() => handleApprove(request.id)} size="sm" className="bg-primary hover:bg-primary/90">
              <CheckCircle className="h-4 w-4 ml-2" />
              تأیید
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <XCircle className="h-4 w-4 ml-2" />
                  رد
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>رد درخواست KYC</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>دلیل رد</Label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="دلیل رد درخواست را وارد کنید..."
                    />
                  </div>
                  <Button onClick={() => handleReject(request.id)} variant="destructive" className="w-full">
                    تأیید رد درخواست
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">مدیریت احراز هویت (KYC)</h2>
        <div className="flex items-center gap-4">
          <Badge className="bg-accent/20 text-accent border-accent/30">
            {pendingRequests.length} در انتظار
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            در انتظار ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="verified" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            تأیید شده ({verifiedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            رد شده ({rejectedRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pendingRequests.map((request) => (
              <KycCard key={request.id} request={request} />
            ))}
            {pendingRequests.length === 0 && (
              <p className="text-muted-foreground col-span-2 text-center py-8">
                درخواست در انتظاری وجود ندارد
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="verified" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {verifiedRequests.map((request) => (
              <KycCard key={request.id} request={request} />
            ))}
            {verifiedRequests.length === 0 && (
              <p className="text-muted-foreground col-span-2 text-center py-8">
                درخواست تأیید شده‌ای وجود ندارد
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {rejectedRequests.map((request) => (
              <KycCard key={request.id} request={request} />
            ))}
            {rejectedRequests.length === 0 && (
              <p className="text-muted-foreground col-span-2 text-center py-8">
                درخواست رد شده‌ای وجود ندارد
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
