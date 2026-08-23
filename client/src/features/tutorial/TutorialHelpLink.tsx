import React from "react";
import { CircleHelp } from "lucide-react";
import { Link } from "wouter";
import { tutorialHrefForStep } from "./model";

export function TutorialHelpLink({ step, label = "Need help?" }: { step: number; label?: string }) {
  return <Link href={tutorialHrefForStep(step)} className="tutorial-help-link"><CircleHelp size={13} /> {label}</Link>;
}
