import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
} from "recharts";
import type { CountItem, ReportAnalysis } from "@/lib/fastbooks";
import { reconcile } from "@/lib/fastbooks";

const fmt = (n: number) => (Number.isFinite(n) ? n : 0).toLocaleString("fa-IR", { maximumFractionDigits: 2 });

const Section = ({
  no, title, children,
}: { no: number; title: string; children: React.ReactNode }) => (
  <Card className="bg-card border-border break-inside-avoid">
    <CardHeader className="pb-3">
      <CardTitle className="text-base flex items-center gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-primary text-xs font-bold">
          {no.toLocaleString("fa-IR")}
        </span>
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">{children}</CardContent>
  </Card>
);

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="p-3 rounded-lg bg-secondary/40">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-base font-bold font-mono text-foreground mt-1">{value}</p>
  </div>
);

const CountTable = ({ items, keyLabel }: { items: CountItem[]; keyLabel: string }) =>
  items.length ? (
    <Table>
      <TableHeader>
        <TableRow className="border-border hover:bg-transparent">
          <TableHead className="text-right">{keyLabel}</TableHead>
          <TableHead className="text-right">تعداد</TableHead>
          <TableHead className="text-right">دالر</TableHead>
          <TableHead className="text-right">افغانی</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((it) => (
          <TableRow key={it.key} className="border-border">
            <TableCell className="text-sm">{it.key}</TableCell>
            <TableCell className="text-sm font-mono">{fmt(it.count)}</TableCell>
            <TableCell className="text-sm font-mono">{fmt(it.usd)}</TableCell>
            <TableCell className="text-sm font-mono">{fmt(it.afn)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ) : (
    <p className="text-sm text-muted-foreground">داده‌ای یافت نشد.</p>
  );

const chartAxis = { stroke: "hsl(var(--muted-foreground))", fontSize: 11 };

export const AnalysisReport = ({ analysis }: { analysis: ReportAnalysis }) => (
  <div className="space-y-4">
    <Section no={1} title="خلاصه کلی گزارش">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="نوع گزارش" value={analysis.kindLabel} />
        <Stat label="تعداد رکورد" value={fmt(analysis.count)} />
        <Stat label="مجموع دالر" value={fmt(analysis.usd.total)} />
        <Stat label="مجموع افغانی" value={fmt(analysis.afn.total)} />
        <Stat label="میانگین دالر" value={fmt(analysis.usd.avg)} />
        <Stat label="بیشترین دالر" value={fmt(analysis.usd.max)} />
        <Stat label="میانگین افغانی" value={fmt(analysis.afn.avg)} />
        <Stat label="بیشترین افغانی" value={fmt(analysis.afn.max)} />
      </div>
    </Section>

    <Section no={2} title="روند ماهانه تراکنش‌ها">
      {analysis.byMonth.length ? (
        <div className="h-64 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analysis.byMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="key" {...chartAxis} />
              <YAxis {...chartAxis} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="count" name="تعداد" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : null}
      <CountTable items={analysis.byMonth} keyLabel="ماه" />
    </Section>

    <Section no={3} title="پرتراکنش‌ترین روزها و توزیع ساعتی">
      <CountTable items={analysis.byDay} keyLabel="تاریخ" />
      <CountTable items={analysis.byHourBucket} keyLabel="بازه ساعتی" />
    </Section>

    <Section no={4} title="فرستندگان و گیرندگان برتر">
      <CountTable items={analysis.topSenders} keyLabel="فرستنده" />
      <CountTable items={analysis.topReceivers} keyLabel="گیرنده" />
    </Section>

    <Section no={5} title="اهداف حواله و منابع عاید">
      <CountTable items={analysis.purposes} keyLabel="هدف" />
      <CountTable items={analysis.sources} keyLabel="منبع عاید" />
    </Section>

    <Section no={6} title="تحلیل نرخ ارز">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="تعداد نرخ" value={fmt(analysis.rates.count)} />
        <Stat label="میانگین نرخ" value={fmt(analysis.rates.avg)} />
        <Stat label="بیشترین" value={fmt(analysis.rates.max)} />
        <Stat label="کمترین" value={fmt(analysis.rates.min)} />
      </div>
      {analysis.rates.byMonth.length ? (
        <div className="h-56 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analysis.rates.byMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="key" {...chartAxis} />
              <YAxis domain={["auto", "auto"]} {...chartAxis} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Line type="monotone" dataKey="avg" name="میانگین نرخ" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </Section>

    <Section no={7} title="کمیشن و درآمد">
      <div className="grid grid-cols-2 gap-3">
        <Stat label="مجموع کمیشن" value={fmt(analysis.commissionTotal)} />
        <Stat
          label="میانگین کمیشن هر تراکنش"
          value={fmt(analysis.count ? analysis.commissionTotal / analysis.count : 0)}
        />
      </div>
      <CountTable items={analysis.commissionByPurpose} keyLabel="هدف" />
    </Section>

    <Section no={8} title="کارمندان / اپراتورها">
      <CountTable items={analysis.operators} keyLabel="توسط" />
    </Section>

    <Section no={9} title="ناهنجاری‌ها و رکوردهای تکراری">
      {analysis.anomalies.length ? (
        <ul className="list-disc pr-5 space-y-1 text-sm text-foreground">
          {analysis.anomalies.map((a) => <li key={a}>{a}</li>)}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">ناهنجاری مهمی یافت نشد.</p>
      )}
      {analysis.duplicates.length ? (
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-right">کلید تکراری</TableHead>
              <TableHead className="text-right">تعداد</TableHead>
              <TableHead className="text-right">ردیف‌ها</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {analysis.duplicates.map((d) => (
              <TableRow key={d.key} className="border-border">
                <TableCell className="text-xs">{d.key.replace(/\|/g, " | ")}</TableCell>
                <TableCell className="text-sm font-mono">{fmt(d.count)}</TableCell>
                <TableCell className="text-sm font-mono">{d.rows.join("، ")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-muted-foreground">رکورد تکراری یافت نشد.</p>
      )}
    </Section>
  </div>
);

export const ReconciliationCard = ({ analyses }: { analyses: ReportAnalysis[] }) => {
  const r = reconcile(analyses);
  if (!r) return null;
  return (
    <Card className="bg-card border-border break-inside-avoid">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">تطبیق متقابل گزارش‌ها</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="حواله دریافتی" value={fmt(r.incomingCount)} />
        <Stat label="حواله ارسالی" value={fmt(r.outgoingCount)} />
        <Stat label="تبادلات اسعار" value={fmt(r.exchangeCount)} />
        <Stat label="شماره‌های تطبیق‌شده" value={fmt(r.matchedHawalaNumbers)} />
        <Stat label="دریافتی بدون تطبیق" value={fmt(r.unmatchedIncoming)} />
        <Stat label="ارسالی بدون تطبیق" value={fmt(r.unmatchedOutgoing)} />
        <Stat label="خالص دالر" value={fmt(r.usdNet)} />
        <Stat label="خالص افغانی" value={fmt(r.afnNet)} />
      </CardContent>
    </Card>
  );
};
