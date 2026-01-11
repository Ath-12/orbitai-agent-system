"use client";

import Link from "next/link";
import { Eye, Brain, Zap, ArrowRight, LayoutDashboard, Hexagon } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-orange-500/30 transition-colors duration-500">
      
      {/* Navbar */}
      <nav className="sticky top-0 z-50 flex items-center justify-between w-full px-6 py-4 glass-panel border-b-0 backdrop-blur-md bg-background/80">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8">
            <Hexagon className="absolute w-8 h-8 text-primary fill-primary/10 stroke-2" />
            <LayoutDashboard className="relative w-4 h-4 text-primary" />
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground">OrbitAI</span>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/login" className="group flex items-center gap-2 px-5 py-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
            LOGIN
            <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-1 flex-col items-center justify-center text-center px-6 py-20 relative">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border text-xs font-bold text-muted-foreground mb-8">
           <span className="relative flex h-2 w-2">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
           </span>
           SYSTEM V2.0 ONLINE
        </div>
        
        {/* Headline - FIXED COLORS */}
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 max-w-5xl text-foreground leading-[1.1]">
          YOUR WORK <br/>
          {/* Force Black start in light mode, Force White start in dark mode */}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-219 via-orange-500 to-orange-400 dark:from-orange-200 dark:via-orange-400 dark:to-orange-500">
            IN ORBIT. 
          </span>
        </h1>
        
        {/* Subtext */}
        <p className="max-w-2xl mx-auto text-muted-foreground text-lg md:text-xl font-medium leading-relaxed mb-10">
          OrbitAI observes your work, remembers your goals, and tells you exactly what to do next. <br/>
          <span className="text-foreground font-bold">Stop managing tasks. Start finishing them.</span>
        </p>
        
        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
          <Link 
            href="/login" 
            className="h-14 px-10 rounded-xl bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center hover:opacity-90 hover:scale-105 transition-all shadow-xl shadow-primary/20"
          >
            INITIALIZE AGENT
          </Link>
          
          <Link 
            href="#features" 
            className="h-14 px-10 rounded-xl bg-card border border-border text-foreground font-bold text-lg flex items-center justify-center hover:bg-secondary transition-all"
          >
             How it Works
          </Link>
        </div>
      </section>

      {/* Feature Grid - The "How it Works" Destination */}
      <section id="features" className="px-6 pb-24 max-w-7xl mx-auto w-full scroll-mt-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* OBSERVE */}
          <div className="group p-8 glass-panel rounded-3xl hover:border-blue-500/30 transition-all duration-300 flex flex-col">
            <div className="mb-6 inline-flex p-4 rounded-2xl bg-blue-500/10 text-blue-500 w-fit">
              <Eye className="h-8 w-8" />
            </div>
            <h3 className="font-black text-2xl mb-2 text-foreground tracking-tight">
              OBSERVE
            </h3>
            <p className="text-sm font-bold text-blue-500 mb-4 uppercase tracking-widest">
              Your work in real time
            </p>
            <p className="text-muted-foreground font-medium leading-relaxed mb-6 flex-1">
              OrbitAI quietly monitors your goals, tasks, and progress in the background. No manual updates. No constant input. It always knows where you stand.
            </p>
            <div className="pt-6 border-t border-border/50 text-xs font-semibold text-muted-foreground">
              So you don’t waste energy tracking everything yourself.
            </div>
          </div>

          {/* THINK */}
          <div className="group p-8 glass-panel rounded-3xl hover:border-purple-500/30 transition-all duration-300 flex flex-col">
            <div className="mb-6 inline-flex p-4 rounded-2xl bg-purple-500/10 text-purple-500 w-fit">
              <Brain className="h-8 w-8" />
            </div>
            <h3 className="font-black text-2xl mb-2 text-foreground tracking-tight">
              THINK
            </h3>
            <p className="text-sm font-bold text-purple-500 mb-4 uppercase tracking-widest">
              Expert prioritization
            </p>
            <p className="text-muted-foreground font-medium leading-relaxed mb-6 flex-1">
              OrbitAI analyzes your tasks, deadlines, and recent activity. It understands what’s urgent, what’s blocked, and what can wait.
            </p>
            <div className="pt-6 border-t border-border/50 text-xs font-semibold text-muted-foreground">
              So you don’t feel overwhelmed by long task lists.
            </div>
          </div>

          {/* ACT */}
          <div className="group p-8 glass-panel rounded-3xl hover:border-orange-500/30 transition-all duration-300 flex flex-col">
            <div className="mb-6 inline-flex p-4 rounded-2xl bg-orange-500/10 text-orange-500 w-fit">
              <Zap className="h-8 w-8" />
            </div>
            <h3 className="font-black text-2xl mb-2 text-foreground tracking-tight">
              ACT
            </h3>
            <p className="text-sm font-bold text-orange-500 mb-4 uppercase tracking-widest">
              Direct attention
            </p>
            <p className="text-muted-foreground font-medium leading-relaxed mb-6 flex-1">
              Instead of showing you everything, OrbitAI recommends one clear next step. No guessing. No context switching.
            </p>
            <div className="pt-6 border-t border-border/50 text-xs font-semibold text-muted-foreground">
              So you make progress every time you open the app.
            </div>
          </div>

        </div>
      </section>
      

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 text-center bg-secondary/30">
        <p className="text-muted-foreground text-sm mb-6 uppercase tracking-widest font-semibold">Powered By</p>
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
           <span className="flex items-center gap-2 font-bold text-lg text-foreground"><span className="text-xl">▲</span> Next.js</span>
           <span className="flex items-center gap-2 font-bold text-lg text-red-500">Supabase</span>
           <span className="flex items-center gap-2 font-bold text-lg text-blue-500">Gemini AI</span>
        </div>
        <div className="mt-12 text-muted-foreground text-xs">
          © {new Date().getFullYear()} OrbitAI. Built for Internship Submission.
        </div>
      </footer>
    </div>
  );
}