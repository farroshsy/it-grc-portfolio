import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

const NotFound = lazy(() => import("@/pages/NotFound"));
const CaseStudy = lazy(() => import("./pages/CaseStudy"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AuditRoom = lazy(() => import("./pages/AuditRoom"));
const AuditWorkpaperPage = lazy(() => import("./pages/AuditWorkpaperPage"));
const Administration = lazy(() => import("./pages/Administration"));
const ControlAssuranceHub = lazy(() => import("./pages/ControlAssuranceHub"));
const ComplianceDashboard = lazy(() => import("./pages/ComplianceDashboard"));
const ExecutiveBriefing = lazy(() => import("./pages/ExecutiveBriefing"));
const Home = lazy(() => import("./pages/Home"));
const HowToUse = lazy(() => import("./pages/HowToUse"));
const PolicyPack = lazy(() => import("./pages/PolicyPack"));
const SkillsCertifications = lazy(() => import("./pages/SkillsCertifications"));
const TechnicalVerification = lazy(() => import("./pages/TechnicalVerification"));

function RouteLoadingFallback() {
  return <main className="page-loading" role="status" aria-live="polite">Loading Control Ledger workspace…</main>;
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/how-to-use"} component={HowToUse} />
        <Route path={"/case-studies/:slug"} component={CaseStudy} />
        <Route path={"/dashboard"} component={Dashboard} />
        <Route path={"/audit-room"} component={AuditRoom} />
        <Route path={"/audit-workpaper"} component={AuditWorkpaperPage} />
        <Route path={"/workspace"} component={ControlAssuranceHub} />
        <Route path={"/administration"} component={Administration} />
        <Route path={"/compliance-dashboard"} component={ComplianceDashboard} />
        <Route path={"/technical-verification"} component={TechnicalVerification} />
        <Route path={"/policy-pack"} component={PolicyPack} />
        <Route path={"/executive-briefing"} component={ExecutiveBriefing} />
        <Route path={"/skills-certifications"} component={SkillsCertifications} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
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
