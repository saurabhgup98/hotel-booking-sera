import type { Metadata } from "next";
import RevenueCalculator from "./RevenueCalculator";

export const metadata: Metadata = { title: "Revenue calculator · Sera Hotels and Resorts" };

// Apti's hospitality revenue calculator, kept in Apti's own look (see
// calculator.css). Here for testing; the same page is in sera-admin.
export default function CalculatorPage() {
  return <RevenueCalculator />;
}
