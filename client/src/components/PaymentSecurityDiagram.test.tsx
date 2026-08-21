/** @vitest-environment jsdom */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PaymentSecurityDiagram from "./PaymentSecurityDiagram";

describe("PaymentSecurityDiagram", () => {
  it("updates the inspector when an individual hosted-payment-entry flow is selected", () => {
    render(<PaymentSecurityDiagram />);

    fireEvent.click(screen.getByRole("button", { name: "Inspect 2 · Hosted payment entry" }));

    expect(screen.getByText("Selected data flow")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "2 · Hosted payment entry" })).toBeTruthy();
    expect(screen.getByText("Merchant → CDE")).toBeTruthy();
    expect(screen.getByText(/Simulated payment entry payload travels from Merchant checkout to Payment gateway edge/i)).toBeTruthy();
    expect(screen.getByText("Hosted-field architecture decision")).toBeTruthy();
  });
});
