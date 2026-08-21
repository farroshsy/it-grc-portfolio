import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import CaseStudy from "./pages/CaseStudy";
import Dashboard from "./pages/Dashboard";
import AuditRoom from "./pages/AuditRoom";
import AuditWorkpaperPage from "./pages/AuditWorkpaperPage";
import ControlAssuranceHub from "./pages/ControlAssuranceHub";
import ExecutiveBriefing from "./pages/ExecutiveBriefing";
import Home from "./pages/Home";
import PolicyPack from "./pages/PolicyPack";
import SkillsCertifications from "./pages/SkillsCertifications";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/case-studies/:slug"} component={CaseStudy} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/audit-room"} component={AuditRoom} />
      <Route path={"/audit-workpaper"} component={AuditWorkpaperPage} />
      <Route path={"/workspace"} component={ControlAssuranceHub} />
      <Route path={"/policy-pack"} component={PolicyPack} />
      <Route path={"/executive-briefing"} component={ExecutiveBriefing} />
      <Route path={"/skills-certifications"} component={SkillsCertifications} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
