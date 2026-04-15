import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import purplleLogo from "@/assets/purplle-logo.jpg";

interface LockScreenProps {
  onUnlock: () => void;
}

const LockScreen = ({ onUnlock }: LockScreenProps) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [shaking, setShaking] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "purplle123") {
      onUnlock();
    } else {
      setError(true);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-fuchsia-50">
      <div
        className={`w-full max-w-md mx-4 rounded-2xl border border-purple-100 bg-white/80 backdrop-blur-xl shadow-2xl shadow-purple-200/40 p-10 flex flex-col items-center gap-6 transition-transform ${shaking ? "animate-shake" : ""}`}
      >
        <img src={purplleLogo} alt="Purplle" className="h-14 object-contain" />
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">
            Skill & MP Utilization Dashboard
          </h1>
          <p className="text-sm text-gray-500">Enter password to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              className={`pl-10 pr-10 h-12 rounded-xl border-purple-200 focus-visible:ring-purple-400 ${error ? "border-red-400 focus-visible:ring-red-400" : ""}`}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {error && (
            <p className="text-xs text-red-500 text-center">Incorrect password. Try again.</p>
          )}
          <Button
            type="submit"
            className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:from-purple-700 hover:to-fuchsia-600 text-white font-semibold text-base shadow-lg shadow-purple-300/40"
          >
            Unlock Dashboard
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LockScreen;
