import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Operational</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Storage Used</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-2xl font-bold">45%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Uploads</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-2xl font-bold">12</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
