"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { createSupabaseClient } from "@/lib/supabase"; 
import { useRouter } from "next/navigation";
import {
  Loader2, Target, ListTodo, Brain, Bot,
  Play, CheckCircle2, ArrowLeft, Hexagon, Zap, Activity, Send,
  Bell, CalendarClock // <--- Added icons for Reminders
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Task {
  id: string; title: string; priority: "high" | "medium" | "low"; status: string; due_date?: string;
}

// ✅ Updated Interface to include Reminders
interface AgentState {
  userGoal: { title: string; status: string } | null;
  activeTasks: Task[];
  activeReminders: { id: string; message: string; remind_at: string }[]; // <--- NEW
  recentMemory: { content: string }[];
}

export default function DashboardPage() {
  const [state, setState] = useState<AgentState | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [viewMode, setViewMode] = useState<"focus" | "all">("all");
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createSupabaseClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push("/login");
      else {
        setUser(user);
        fetchState(user.id);
      }
    };
    checkUser();
  }, []);

  const fetchState = async (realUserId: string) => {
    try {
      const res = await api.get(`/agent/state/${realUserId}`);
      setState(res.data.state);
    } catch (err) {
      console.error("Failed to load state", err);
      setState({ userGoal: null, activeTasks: [], activeReminders: [], recentMemory: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleRunAgent = async () => {
    if (!user) return;
    setIsRunning(true);
    setLastMessage(null);
    try {
      const res = await api.post("/agent/run", { 
        userId: user.id, runType: "manual", userQuery: input 
      });
      if (res.data.success) { setLastMessage(res.data.result.decision.message); }
      setInput("");
      await fetchState(user.id);
    } catch (err) { 
      setLastMessage("⚠️ Agent failed to run."); 
    } finally { 
      setIsRunning(false); 
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    if (!user) return;
    setState(prev => prev ? ({ ...prev, activeTasks: prev.activeTasks.filter(t => t.id !== taskId) }) : null);
    try { await api.post(`/tasks/${taskId}/complete`, { userId: user.id }); } 
    catch (err) { fetchState(user.id); }
  };

  // FILTER LOGIC
  const rawTasks = state?.activeTasks || [];
  const displayedTasks = rawTasks.filter((task) => {
    if (viewMode === "all") return true;
    const isHighPriority = task.priority === "high";
    const today = new Date().toISOString().split("T")[0];
    const isDue = task.due_date ? task.due_date.split("T")[0] <= today : false;
    return isHighPriority || isDue;
  });

  if (loading) return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  if (!user) return null; 

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-32">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 glass-panel">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 rounded-lg hover:bg-secondary"><ArrowLeft className="h-5 w-5 text-muted-foreground" /></Link>
            <span className="font-bold text-lg tracking-tight">OrbitAI</span>
          </div>
          <div className="flex items-center gap-3">
             <ThemeToggle />
             <button onClick={handleRunAgent} disabled={isRunning} className={`relative overflow-hidden rounded-lg px-6 py-2 text-sm font-bold text-primary-foreground shadow-md transition-all ${isRunning ? "bg-muted text-muted-foreground" : "bg-primary hover:opacity-90"}`}>
              <span className="flex items-center gap-2">
                {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
                {isRunning ? "PROCESSING..." : "RUN AGENT"}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        
        {/* HERO */}
        <section className="mb-8 relative overflow-hidden rounded-3xl glass-panel p-8 border-l-8 border-l-primary">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-widest"><Target className="h-5 w-5" /> Current Objective</div>
            {state?.userGoal && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase"><Activity className="h-3 w-3" /> {state.userGoal.status}</span>}
          </div>
          {state?.userGoal ? <h1 className="text-3xl font-extrabold">{state.userGoal.title}</h1> : <h2 className="text-2xl font-bold text-muted-foreground">No active goal.</h2>}
        </section>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
          
          {/* TASKS */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-panel p-8 rounded-3xl min-h-[500px] flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-secondary rounded-xl"><ListTodo className="h-6 w-6" /></div>
                  <h2 className="text-2xl font-bold">Action Items</h2>
                </div>
                {/* TOGGLE BUTTONS */}
                <div className="flex bg-secondary/50 rounded-lg p-1 border border-border/50">
                    <button onClick={() => setViewMode("focus")} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === "focus" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Focus</button>
                    <button onClick={() => setViewMode("all")} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === "all" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>All</button>
                </div>
              </div>

              <div className="flex-1 space-y-3">
                {displayedTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-20 text-muted-foreground opacity-50">
                    <CheckCircle2 className="h-20 w-20 mb-4" />
                    <p className="text-xl font-medium">{viewMode === 'focus' ? "Nothing due today!" : "All Systems Clear"}</p>
                  </div>
                ) : (
                  displayedTasks.map((task) => (
                    <div key={task.id} className="group flex items-center justify-between p-5 rounded-2xl border border-border/40 hover:border-primary/50 transition-all bg-card hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <div onClick={() => handleCompleteTask(task.id)} className="h-6 w-6 rounded-full border-2 border-muted-foreground/30 group-hover:border-primary cursor-pointer transition-colors hover:bg-primary/20" />
                        <div>
                          <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{task.title}</h4>
                          {task.due_date && <p className="text-xs text-muted-foreground mt-1">Due: {new Date(task.due_date).toLocaleDateString()}</p>}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${task.priority === 'high' ? 'bg-red-500/10 text-red-600' : task.priority === 'medium' ? 'bg-orange-500/10 text-orange-600' : 'bg-blue-500/10 text-blue-600'}`}>{task.priority}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (Brain + Memory) */}
          <div className="lg:col-span-5 space-y-6">
            <section className={`glass-panel p-6 rounded-3xl relative overflow-hidden ${lastMessage ? 'border-primary shadow-lg shadow-primary/10' : ''}`}>
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10" />
              <div className="flex items-center gap-2 mb-4 text-xs font-bold text-primary uppercase tracking-widest"><Bot className="h-4 w-4" /> Neural Output</div>
              <div className="bg-secondary/30 rounded-2xl p-5 border border-border/50">
                <p className="text-base font-medium leading-relaxed">{lastMessage || "Agent is strictly monitoring. No immediate actions recommended."}</p>
              </div>
            </section>

             <section className="glass-panel p-6 rounded-3xl">
              <div className="flex items-center gap-2 mb-4 text-xs font-bold text-muted-foreground uppercase tracking-widest"><Brain className="h-4 w-4" /> Memory Stream</div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {state?.recentMemory?.map((m, i) => (
                  <div key={i} className="flex gap-3 text-sm text-muted-foreground p-3 rounded-xl hover:bg-secondary/40 transition-colors">
                    <Zap className="h-4 w-4 mt-0.5 text-orange-500 shrink-0" />
                    <span className="leading-relaxed">"{m.content}"</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* ✅ NEW: REMINDERS SECTION */}
        <section className="mb-24 glass-panel p-8 rounded-3xl border border-border/40">
           <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                <Bell className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold">Upcoming Reminders</h2>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(!state?.activeReminders || state.activeReminders.length === 0) ? (
                 <div className="col-span-full py-8 text-center text-muted-foreground text-sm">
                    No active reminders. Ask OrbitAI: "Remind me to call Mom on Friday"
                 </div>
              ) : (
                state.activeReminders.map((reminder) => (
                  <div key={reminder.id} className="flex items-start gap-4 p-4 rounded-2xl bg-secondary/20 border border-border/50 hover:border-primary/30 transition-all">
                     <CalendarClock className="h-8 w-8 text-muted-foreground opacity-50" />
                     <div>
                        <p className="font-semibold text-foreground">{reminder.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                           {new Date(reminder.remind_at).toLocaleDateString()} at {new Date(reminder.remind_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                     </div>
                  </div>
                ))
              )}
           </div>
        </section>

        {/* INPUT BAR */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50">
          <div className="glass-panel p-2 rounded-full shadow-2xl flex items-center gap-2 pl-6">
            <input 
              type="text" value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="Ask OrbitAI to create a task, reschedule, or set a reminder..." 
              className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground font-medium"
              onKeyDown={(e) => e.key === 'Enter' && handleRunAgent()}
            />
            <button onClick={handleRunAgent} disabled={isRunning || !input.trim()} className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}