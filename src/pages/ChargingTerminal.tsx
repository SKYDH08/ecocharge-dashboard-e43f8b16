import { useState, useRef, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Leaf, Settings, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { connectVehicle } from "@/lib/api";
import { toast } from "sonner";

type ChargingMode = "CHARGE_NOW" | "FULL_CHARGE" | "CUSTOM";

interface VehicleResponse {
  Slot_ID: string;
  Initial_Source: string;
  Est_Bill: number;
}

const ChargingTerminal = () => {
  const [part1, setPart1] = useState("");
  const [part2, setPart2] = useState("");
  const [part3, setPart3] = useState("");
  const [part4, setPart4] = useState("");
  const [mode, setMode] = useState<ChargingMode>("CHARGE_NOW");
  const [customKwh, setCustomKwh] = useState([50]);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<VehicleResponse | null>(null);

  const input1Ref = useRef<HTMLInputElement>(null);
  const input2Ref = useRef<HTMLInputElement>(null);
  const input3Ref = useRef<HTMLInputElement>(null);
  const input4Ref = useRef<HTMLInputElement>(null);

  const handleInput = (
    value: string,
    setter: (v: string) => void,
    maxLength: number,
    nextRef: React.RefObject<HTMLInputElement> | null,
    isNumeric: boolean
  ) => {
    const regex = isNumeric ? /^[0-9]*$/ : /^[A-Z]*$/;
    if (regex.test(value) && value.length <= maxLength) {
      setter(value.toUpperCase());
      if (value.length === maxLength && nextRef?.current) {
        nextRef.current.focus();
      }
    }
  };

  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    prevRef: React.RefObject<HTMLInputElement> | null,
    currentValue: string
  ) => {
    if (e.key === "Backspace" && currentValue === "" && prevRef?.current) {
      prevRef.current.focus();
    }
  };

  const handleSubmit = async () => {
    const vehicleId = `${part1}-${part2}-${part3}-${part4}`;
    
    if (part1.length !== 2 || part2.length !== 2 || part3.length !== 2 || part4.length !== 4) {
      toast.error("Please enter a valid vehicle number");
      return;
    }

    setIsLoading(true);
    try {
      const res = await connectVehicle({
        vehicle_id: vehicleId,
        mode,
        custom_kwh: mode === "CUSTOM" ? customKwh[0] : 0,
      });
      setResponse(res.data);
      toast.success("Vehicle connected successfully!");
    } catch (error: any) {
      if (error.response?.status === 503) {
        toast.error("Grid Capacity Reached. Please wait.");
      } else {
        toast.error("Connection failed. Reconnecting to Grid...");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setPart1("");
    setPart2("");
    setPart3("");
    setPart4("");
    setMode("CHARGE_NOW");
    setCustomKwh([50]);
    setResponse(null);
  };

  const getSourceBadge = (source: string) => {
    if (source.includes("RENEWABLE")) {
      return (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-success/20 border border-success">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
          <span className="text-success-foreground font-medium">Powered by Green Energy</span>
        </div>
      );
    } else if (source.includes("CONVENTIONAL")) {
      return (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/20 border border-destructive">
          <AlertCircle className="w-4 h-4 text-destructive" />
          <span className="text-destructive-foreground font-medium">Grid Power (High Load)</span>
        </div>
      );
    } else if (source.includes("PAUSED")) {
      return (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-warning/20 border border-warning">
          <AlertCircle className="w-4 h-4 text-warning" />
          <span className="text-warning-foreground font-medium">Waiting for Solar Peak</span>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <AnimatePresence mode="wait">
        {!response ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl"
          >
            <div className="bg-card/80 backdrop-blur-md border border-border rounded-2xl p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-8">
                <Zap className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold text-foreground">Connect Your Vehicle</h1>
              </div>

              {/* Vehicle Number Input */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-muted-foreground mb-3">
                  Vehicle Number
                </label>
                <div className="flex gap-2 justify-center">
                  <input
                    ref={input1Ref}
                    type="text"
                    value={part1}
                    onChange={(e) => handleInput(e.target.value, setPart1, 2, input2Ref, false)}
                    onKeyDown={(e) => handleKeyDown(e, null, part1)}
                    className="w-16 h-16 text-center text-2xl font-bold bg-muted border-2 border-border rounded-lg focus:border-primary focus:outline-none transition-colors"
                    placeholder="AA"
                    maxLength={2}
                  />
                  <span className="text-3xl text-muted-foreground self-center">-</span>
                  <input
                    ref={input2Ref}
                    type="text"
                    value={part2}
                    onChange={(e) => handleInput(e.target.value, setPart2, 2, input3Ref, true)}
                    onKeyDown={(e) => handleKeyDown(e, input1Ref, part2)}
                    className="w-16 h-16 text-center text-2xl font-bold bg-muted border-2 border-border rounded-lg focus:border-primary focus:outline-none transition-colors"
                    placeholder="11"
                    maxLength={2}
                  />
                  <span className="text-3xl text-muted-foreground self-center">-</span>
                  <input
                    ref={input3Ref}
                    type="text"
                    value={part3}
                    onChange={(e) => handleInput(e.target.value, setPart3, 2, input4Ref, false)}
                    onKeyDown={(e) => handleKeyDown(e, input2Ref, part3)}
                    className="w-16 h-16 text-center text-2xl font-bold bg-muted border-2 border-border rounded-lg focus:border-primary focus:outline-none transition-colors"
                    placeholder="AA"
                    maxLength={2}
                  />
                  <span className="text-3xl text-muted-foreground self-center">-</span>
                  <input
                    ref={input4Ref}
                    type="text"
                    value={part4}
                    onChange={(e) => handleInput(e.target.value, setPart4, 4, null, true)}
                    onKeyDown={(e) => handleKeyDown(e, input3Ref, part4)}
                    className="w-24 h-16 text-center text-2xl font-bold bg-muted border-2 border-border rounded-lg focus:border-primary focus:outline-none transition-colors"
                    placeholder="1111"
                    maxLength={4}
                  />
                </div>
              </div>

              {/* Charging Mode Selection */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-muted-foreground mb-3">
                  Charging Mode
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setMode("CHARGE_NOW")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      mode === "CHARGE_NOW"
                        ? "border-destructive bg-destructive/10"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <Zap className="w-8 h-8 text-destructive mb-2" />
                    <h3 className="font-bold text-foreground mb-1">Charge Now</h3>
                    <p className="text-xs text-muted-foreground">Immediate Speed. Market Price.</p>
                  </button>

                  <button
                    onClick={() => setMode("FULL_CHARGE")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      mode === "FULL_CHARGE"
                        ? "border-success bg-success/10"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <Leaf className="w-8 h-8 text-success mb-2" />
                    <h3 className="font-bold text-foreground mb-1">Full Charge (Eco)</h3>
                    <p className="text-xs text-muted-foreground">Optimized for Cost. Waits for Renewable.</p>
                  </button>

                  <button
                    onClick={() => setMode("CUSTOM")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      mode === "CUSTOM"
                        ? "border-accent bg-accent/10"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <Settings className="w-8 h-8 text-accent mb-2" />
                    <h3 className="font-bold text-foreground mb-1">Custom Limit</h3>
                    <p className="text-xs text-muted-foreground">Set specific kWh.</p>
                  </button>
                </div>

                {/* Custom kWh Slider */}
                <AnimatePresence>
                  {mode === "CUSTOM" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 p-4 bg-muted rounded-lg"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">Energy Limit</span>
                        <span className="text-2xl font-bold text-accent">{customKwh[0]} kWh</span>
                      </div>
                      <Slider
                        value={customKwh}
                        onValueChange={setCustomKwh}
                        min={10}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-foreground" />
                ) : (
                  <>
                    Connect & Charge
                    <ArrowRight className="ml-2" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="invoice"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl"
          >
            <div className="bg-card/80 backdrop-blur-md border border-border rounded-2xl p-8 shadow-2xl text-center">
              <CheckCircle className="w-20 h-20 text-success mx-auto mb-6" />
              
              <h2 className="text-sm font-medium text-muted-foreground mb-2">ASSIGNED SLOT</h2>
              <div className="text-8xl font-bold text-primary mb-8">{response.Slot_ID}</div>

              <div className="flex justify-center mb-8">
                {getSourceBadge(response.Initial_Source)}
              </div>

              <div className="bg-muted rounded-xl p-6 mb-8">
                <p className="text-sm text-muted-foreground mb-2">Total Estimated Bill</p>
                <p className="text-5xl font-bold text-success">₹{response.Est_Bill.toFixed(2)}</p>
              </div>

              <Button
                onClick={resetForm}
                variant="outline"
                className="w-full h-12"
              >
                Start New Session
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChargingTerminal;
