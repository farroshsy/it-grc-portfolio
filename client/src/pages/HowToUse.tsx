import React, { useEffect, useState } from "react";
import { Link, useSearch } from "wouter";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { SiteShell } from "@/components/PortfolioChrome";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { TUTORIAL_STEP_COUNT, tutorialSteps } from "@/features/tutorial/model";

export default function HowToUse() {
  const { isAuthenticated } = useAuth();
  const search = useSearch();
  const progress = trpc.tutorial.progress.useQuery(undefined, { enabled: isAuthenticated });
  const saveProgress = trpc.tutorial.saveProgress.useMutation({ onSuccess: () => void progress.refetch() });
  const submitFeedback = trpc.tutorial.submitFeedback.useMutation({ onSuccess: () => { setFeedbackMessage(""); setFeedbackContact(""); setFeedbackStatus("Thanks — your feedback has been recorded for the product review queue."); }, onError: () => setFeedbackStatus("We could not record feedback right now. Please try again shortly.") });
  const [activeIndex, setActiveIndex] = useState(0);
  const [feedbackCategory, setFeedbackCategory] = useState<"Suggestion" | "Issue" | "Question">("Suggestion");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackContact, setFeedbackContact] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState("");
  const activeStep = tutorialSteps[activeIndex];
  const ActiveIcon = activeStep.icon;
  const queryStep = Number(new URLSearchParams(search).get("step"));
  const deepLinkIndex = Number.isInteger(queryStep) && queryStep >= 1 && queryStep <= TUTORIAL_STEP_COUNT ? queryStep - 1 : null;
  const selectStep = (index: number) => {
    setActiveIndex(index);
    if (isAuthenticated) saveProgress.mutate({ activeStep: index, completed: index === TUTORIAL_STEP_COUNT - 1 });
  };
  useEffect(() => {
    if (deepLinkIndex !== null) {
      setActiveIndex(deepLinkIndex);
      if (isAuthenticated && progress.data?.activeStep !== deepLinkIndex) saveProgress.mutate({ activeStep: deepLinkIndex, completed: deepLinkIndex === TUTORIAL_STEP_COUNT - 1 });
      return;
    }
    if (isAuthenticated && progress.data) setActiveIndex(progress.data.activeStep);
  }, [deepLinkIndex, isAuthenticated, progress.data, saveProgress]);
  const previous = () => selectStep(Math.max(0, activeIndex - 1));
  const next = () => selectStep(Math.min(TUTORIAL_STEP_COUNT - 1, activeIndex + 1));
  const progressNote = !isAuthenticated ? "Sign in to save your place across devices." : progress.isLoading ? "Preparing your private tutorial progress…" : progress.data?.completed ? "You completed this guide. Restart it whenever you need a refresher." : activeIndex > 0 ? `Resuming at step ${activeIndex + 1} of ${TUTORIAL_STEP_COUNT}.` : "Your next tutorial step is saved privately to your account.";

  return <SiteShell><main className="tutorial-page">
    <section className="tutorial-hero"><div><span className="eyebrow"><ShieldCheck size={13} /> Interactive product guide</span><h1>Learn the control loop before you operate it.</h1><p>Use this short walkthrough to understand where each GRC activity belongs, what each role can do, and which boundaries keep the evidence trail defensible.</p></div><aside><span>Estimated route</span><strong>{isAuthenticated && activeIndex > 0 ? "Resume tutorial" : "Five practical steps"}</strong><p>{progressNote}</p>{isAuthenticated && activeIndex > 0 && <button className="tutorial-restart" onClick={() => selectStep(0)}>Restart from step one</button>}</aside></section>

    <section className="tutorial-navigator" aria-label="Tutorial steps"><div className="tutorial-step-list" role="tablist" aria-label="How to use Control Ledger">{tutorialSteps.map((step, index) => { const Icon = step.icon; const selected = index === activeIndex; return <button key={step.title} role="tab" aria-selected={selected} className={selected ? "active" : ""} onClick={() => selectStep(index)}><span>{String(index + 1).padStart(2, "0")}</span><Icon size={15} /><strong>{step.kicker}</strong></button>; })}</div><div className="tutorial-progress" aria-label={`Step ${activeIndex + 1} of ${TUTORIAL_STEP_COUNT}`}><span>Step {activeIndex + 1} of {TUTORIAL_STEP_COUNT}</span><i><b style={{ width: `${((activeIndex + 1) / TUTORIAL_STEP_COUNT) * 100}%` }} /></i></div></section>

    <section className="tutorial-stage" aria-live="polite"><aside><span className="tutorial-step-number">{String(activeIndex + 1).padStart(2, "0")}</span><ActiveIcon size={28} /><span>{activeStep.kicker}</span></aside><div><span className="eyebrow">What to do</span><h2>{activeStep.title}</h2><p>{activeStep.summary}</p><ol>{activeStep.checks.map((check, index) => <li key={check}><span>{index + 1}</span>{check}</li>)}</ol><div className="tutorial-actions"><Link href={activeStep.href} className="button-primary">{activeStep.action} <ArrowRight size={15} /></Link><div><button onClick={previous} disabled={activeIndex === 0}><ArrowLeft size={14} /> Previous</button><button onClick={next} disabled={activeIndex === tutorialSteps.length - 1}>Next <ArrowRight size={14} /></button></div></div></div></section>

    <section className="tutorial-boundaries"><div><span className="eyebrow"><ShieldCheck size={13} /> Operating boundaries</span><h2>Three safeguards to remember.</h2><p>The tutorial explains how the product works; it does not override role controls or provenance labels.</p></div><div className="tutorial-boundary-grid"><article><strong>Role-scoped actions</strong><p>Workspace duties gate evidence submission, assurance testing, and risk approval. Platform administrators retain configuration responsibility.</p></article><article><strong>Evidence stays managed</strong><p>Files are stored separately from lifecycle metadata. Expiry and legal holds shape access without deleting the accountability trail.</p></article><article><strong>Secrets stay server-side</strong><p>Google Directory and queued Gmail reminders display readiness only. OAuth client secrets and refresh tokens never belong in this website’s browser UI.</p></article></div></section>

    <section className="tutorial-feedback"><div><span className="eyebrow">Product feedback</span><h2>Help improve the next control loop.</h2><p>Suggest a clearer workflow, report a product issue, or ask a tutorial question. Do not include evidence contents, credentials, client secrets, or personal data beyond an optional contact address.</p></div>{isAuthenticated ? <form onSubmit={(event) => { event.preventDefault(); setFeedbackStatus(""); if (feedbackMessage.trim().length >= 12) submitFeedback.mutate({ category: feedbackCategory, message: feedbackMessage.trim(), ...(feedbackContact.trim() ? { contactEmail: feedbackContact.trim() } : {}) }); }}><label>Feedback type<select value={feedbackCategory} onChange={(event) => setFeedbackCategory(event.target.value as "Suggestion" | "Issue" | "Question")}><option value="Suggestion">Suggestion</option><option value="Issue">Issue</option><option value="Question">Question</option></select></label><label>Your feedback<textarea value={feedbackMessage} onChange={(event) => setFeedbackMessage(event.target.value)} minLength={12} maxLength={1500} required placeholder="Describe the improvement, question, or issue without including sensitive information." /></label><label>Optional contact email<input type="email" value={feedbackContact} onChange={(event) => setFeedbackContact(event.target.value)} maxLength={320} placeholder="name@example.com" /></label><div className="tutorial-feedback-actions"><small>{feedbackMessage.length}/1500 characters</small><button className="button-primary" disabled={submitFeedback.isPending || feedbackMessage.trim().length < 12}>{submitFeedback.isPending ? "Sending…" : "Send feedback"}</button></div>{feedbackStatus && <p className={submitFeedback.isError ? "feedback-error" : "feedback-success"} role="status">{feedbackStatus}</p>}</form> : <aside><strong>Sign in to send feedback</strong><p>Feedback is tied to an authenticated account to protect the product queue from anonymous spam and to preserve accountable follow-up.</p><button className="button-primary" onClick={() => startLogin()}>Sign in to share feedback</button></aside>}</section>
  </main></SiteShell>;
}
