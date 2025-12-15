import { render, screen, fireEvent } from "@testing-library/react";
import OnboardingTour from "@/app/onboarding/OnboardingTour";

describe("OnboardingTour", () => {
  it("dispatches onboarding run sample event when button clicked", () => {
    const spy = jest.spyOn(window, "dispatchEvent");
    render(<OnboardingTour />);
    const btn = screen.getByText(/Run sample walkthrough/i);
    fireEvent.click(btn);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
