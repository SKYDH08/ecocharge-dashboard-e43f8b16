import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sun, Wind, Activity, Users, AlertTriangle, LogOut } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { getDashboardStats } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DashboardData {
  current_load: {
    value: number;
    capacity: number;
    percentage: number;
  };
  system_health: {
    green_score: number;
  };
  energy_mix: {
    renewable_users: number;
    conventional_users: number;
    paused_users: number;
  };
  predictions: {
    solar_now_kw: number;
    wind_now_kw: number;
    net_green_available_kw: number;
  };
  live_sessions: Array<{
    slot: string;
    vehicle: string;
    mode: string;
    source: string;
  }>;
}

const AdminDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate("/admin/login");
      return;
    }

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [navigate]);

  const fetchData = async () => {
    try {
      const response = await getDashboardStats();
      setData(response.data);
    } catch (error) {
      toast.error("Failed to fetch dashboard data");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    navigate("/admin/login");
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const pieData = [
    { name: "Renewable", value: data.energy_mix.renewable_users, color: "#10B981" },
    { name: "Conventional", value: data.energy_mix.conventional_users, color: "#EF4444" },
    { name: "Paused", value: data.energy_mix.paused_users, color: "#F59E0B" },
  ];

  const getLoadColor = (percentage: number) => {
    if (percentage < 50) return "text-success";
    if (percentage < 70) return "text-warning";
    return "text-destructive";
  };

  const getScoreColor = (score: number) => {
    const hue = (score / 100) * 120;
    return `hsl(${hue}, 70%, 50%)`;
  };

  const getSourceBadge = (source: string) => {
    if (source.includes("RENEWABLE")) {
      return (
        <span className="px-3 py-1 rounded-full bg-success/20 text-success text-xs font-medium">
          Green
        </span>
      );
    } else if (source.includes("CONVENTIONAL")) {
      return (
        <span className="px-3 py-1 rounded-full bg-destructive/20 text-destructive text-xs font-medium">
          Grid
        </span>
      );
    } else if (source.includes("PAUSED")) {
      return (
        <span className="px-3 py-1 rounded-full bg-warning/20 text-warning text-xs font-medium">
          Paused
        </span>
      );
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">EcoCharge AI</h1>
            <p className="text-muted-foreground">Smart Grid Analytics Dashboard</p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* Top Row: Grid Load, Green Score, Energy Mix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Grid Load */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card/80 backdrop-blur-md border border-border rounded-xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Grid Load</h3>
            </div>
            <div className="flex flex-col items-center">
              <div
                className={`text-6xl font-bold mb-2 ${getLoadColor(
                  data.current_load.percentage
                )} ${data.current_load.percentage > 70 ? "animate-pulse-glow" : ""}`}
              >
                {data.current_load.percentage}%
              </div>
              <p className="text-muted-foreground text-sm">
                {data.current_load.value} / {data.current_load.capacity} Cars
              </p>
            </div>
          </motion.div>

          {/* Green Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card/80 backdrop-blur-md border border-border rounded-xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Green Score</h3>
            </div>
            <div className="flex flex-col items-center">
              <div
                className="text-6xl font-bold mb-2"
                style={{ color: getScoreColor(data.system_health.green_score) }}
              >
                {data.system_health.green_score}
              </div>
              <p className="text-muted-foreground text-sm">Eco-Efficiency Rating</p>
            </div>
          </motion.div>

          {/* Energy Mix */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card/80 backdrop-blur-md border border-border rounded-xl p-6"
          >
            <h3 className="font-semibold text-foreground mb-4">Energy Mix</h3>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-around mt-4">
              {pieData.map((item) => (
                <div key={item.name} className="text-center">
                  <div className="text-2xl font-bold" style={{ color: item.color }}>
                    {item.value}
                  </div>
                  <div className="text-xs text-muted-foreground">{item.name}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Weather & Predictions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card/80 backdrop-blur-md border border-border rounded-xl p-6 mb-6"
        >
          <h3 className="font-semibold text-foreground mb-4">Renewable Generation</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <Sun className="w-10 h-10 text-warning" />
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {data.predictions.solar_now_kw} kW
                </p>
                <p className="text-sm text-muted-foreground">Solar Generation</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Wind className="w-10 h-10 text-accent" />
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {data.predictions.wind_now_kw} kW
                </p>
                <p className="text-sm text-muted-foreground">Wind Generation</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <AlertTriangle
                className={`w-10 h-10 ${
                  data.predictions.net_green_available_kw < 0 ? "text-destructive" : "text-success"
                }`}
              />
              <div>
                <p
                  className={`text-2xl font-bold ${
                    data.predictions.net_green_available_kw < 0
                      ? "text-destructive"
                      : "text-success"
                  }`}
                >
                  {data.predictions.net_green_available_kw} kW
                </p>
                <p className="text-sm text-muted-foreground">
                  {data.predictions.net_green_available_kw < 0 ? "DEFICIT" : "Net Available"}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Live Sessions Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card/80 backdrop-blur-md border border-border rounded-xl p-6"
        >
          <h3 className="font-semibold text-foreground mb-4">Live Charging Sessions</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground text-sm font-medium">
                    Slot
                  </th>
                  <th className="text-left py-3 px-4 text-muted-foreground text-sm font-medium">
                    Vehicle
                  </th>
                  <th className="text-left py-3 px-4 text-muted-foreground text-sm font-medium">
                    Mode
                  </th>
                  <th className="text-left py-3 px-4 text-muted-foreground text-sm font-medium">
                    Source
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.live_sessions.map((session, index) => (
                  <motion.tr
                    key={session.slot}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-primary">{session.slot}</td>
                    <td className="py-3 px-4 text-foreground">{session.vehicle}</td>
                    <td className="py-3 px-4 text-muted-foreground">{session.mode}</td>
                    <td className="py-3 px-4">{getSourceBadge(session.source)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
